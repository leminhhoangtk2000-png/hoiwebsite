require('dotenv').config({ path: '.env.local' });
const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const translate = require('google-translate-api-x');

// --- CONFIGURATION ---
const KV_FILE = 'DanhSachSanPham_KV20012026-020153-299.xlsx';
const MEDIA_FILE = 'mass_update_media_info_111608803_20260120023826.xlsx';
const EXCHANGE_RATE = 25400;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- HELPER FUNCTIONS ---
function readExcel(filename, headerRow = 0) {
    const filePath = path.join(__dirname, filename);
    if (!fs.existsSync(filePath)) return [];
    const workbook = XLSX.readFile(filePath);
    return XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { range: headerRow });
}

async function safeTranslate(text) {
    if (!text) return '';
    try {
        const res = await translate(text, { to: 'en' });
        return res.text;
    } catch { return text; }
}

// --- MAIN ---
async function importV2() {
    console.log('Reading files...');
    const kvData = readExcel(KV_FILE, 0);
    const mediaData = readExcel(MEDIA_FILE, 0);

    // 1. Index Shopee Media by SKU (Parent SKU)
    const mediaMap = {};
    mediaData.forEach(row => {
        const pSku = row['et_title_parent_sku'];
        if (pSku) mediaMap[pSku] = row;
    });

    // 2. Group KiotViet Rows by Product Family
    const groups = {}; // Key: ParentSKU, Value: [Rows]

    kvData.forEach(row => {
        const code = row['Mã hàng'];
        const parent = row['Mã HH Liên quan']; // Related Code
        // If related code exists, use it as group key. Else use own code.
        // Special case: Sometimes Parent row has empty "Related", and Child has "Related" pointing to Parent.
        // We need to ensure they end up in same group.

        let groupKey = parent || code;

        // KiotViet logic quirk: If Row A has no parent, it starts a group.
        // Row B has Parent = A. 
        // We need to make sure Row A is also in group A.
        // Since we iterate sequentially, if A comes first: groupKey=A.
        // If B comes second: groupKey=A. Perfect.

        if (!groups[groupKey]) groups[groupKey] = [];
        groups[groupKey].push(row);
    });

    console.log(`Found ${Object.keys(groups).length} Product Groups.`);

    // 3. Process Each Group
    let success = 0;

    // We process sequentially to avoid rate limits
    const groupKeys = Object.keys(groups);
    for (let i = 0; i < groupKeys.length; i++) {
        const gid = groupKeys[i];
        const rows = groups[gid];

        // Identify Main Product Data (usually from the first row or the one with empty 'Related')
        // Or if multiple matches, take the one with the most data?
        const mainRow = rows.find(r => !r['Mã HH Liên quan']) || rows[0];

        const nameVn = mainRow['Tên hàng'];
        const categoryVn = mainRow['Nhóm hàng(3 Cấp)'];
        const priceVnd = mainRow['Giá bán'] || 0;
        const priceUsd = parseFloat((priceVnd / EXCHANGE_RATE).toFixed(2));

        // Translate
        const [nameEn, catEn] = await Promise.all([
            safeTranslate(nameVn),
            safeTranslate(categoryVn)
        ]);

        // Find Shopee Media match (using Group ID as SKU)
        const mediaRow = mediaMap[gid];
        let mainImage = null;
        if (mediaRow) {
            mainImage = mediaRow['et_title_image_cover'];
        }

        // Insert Product
        const { data: prodData, error: prodError } = await supabase
            .from('products')
            .insert({
                name: nameEn || nameVn,
                category: catEn || categoryVn,
                price_vnd: priceVnd,
                price_usd: priceUsd,
                main_image_url: mainImage,
                description: mediaRow ? mediaRow['et_title_product_description'] : ''
            })
            .select()
            .single();

        if (prodError) {
            console.error(`Error inserting product ${gid}:`, prodError.message);
            continue;
        }

        const productId = prodData.id;

        // 4. Process Variants from Attributes ("Thuộc tính")
        // Format: "Màu sắc:Kem|Kíchcỡ:S"
        // Collect all unique options for this product
        const variantMap = {}; // "Color" -> Set("Red", "Blue")

        // Also map specific Option Value to Image (from Shopee)
        // Shopee Media row has: et_title_variation_1 = "Màu sắc", et_title_option_1... = "Kem", et_title_option_image_1...
        const optionImageMap = {}; // "Kem" -> "http..." (Assuming unique values across types? Or Key="Color:Kem")

        if (mediaRow) {
            // Parse Shopee Option Images
            for (let k = 1; k <= 20; k++) {
                const varName = mediaRow[`et_title_variation_${k}`];
                if (!varName) break;
                // Iterate options for this variation
                // Actually Shopee structure in CSV: 
                // Variation 1 Name: "Màu"
                // Option 1 for Var 1: "Đỏ", Image: "http..."
                // Option 2 for Var 1: "Xanh", Image: "http..."
                // Wait, the column headers are: `et_title_option_${j}_for_variation_${k}`

                // We need to scan these columns.
                // Let's assume max 20 options per variation.
                for (let j = 1; j <= 50; j++) {
                    const optVal = mediaRow[`et_title_option_${j}_for_variation_${k}`];
                    const optImg = mediaRow[`et_title_option_image_${j}_for_variation_${k}`];
                    if (!optVal) break;
                    if (optImg) {
                        // Normalize key
                        optionImageMap[optVal.toLowerCase().trim()] = optImg;
                    }
                }
            }
        }

        // Collect Variants from KV rows
        for (const r of rows) {
            const attrStr = r['Thuộc tính'];
            if (!attrStr) continue;

            // "Màu sắc:Kem|Kíchcỡ:S"
            const parts = attrStr.split('|'); // ["Màu sắc:Kem", "Kíchcỡ:S"]
            parts.forEach(p => {
                const [key, val] = p.split(':');
                if (key && val) {
                    const normKey = key.trim(); // Translate this? "Màu sắc" -> "Color"
                    const normVal = val.trim();

                    if (!variantMap[normKey]) variantMap[normKey] = new Set();
                    variantMap[normKey].add(normVal);
                }
            });
        }

        // Insert Variants to DB
        // variantMap: { "Màu sắc": ["Kem", "Đỏ"], "Kíchcỡ": ["S", "M"] }
        for (const [vName, vValues] of Object.entries(variantMap)) {
            // Translate Name
            let vNameEn = vName;
            if (vName.toLowerCase().includes('màu')) vNameEn = 'Color';
            if (vName.toLowerCase().includes('kích') || vName.toLowerCase().includes('size')) vNameEn = 'Size';

            // Create Variant Type
            const { data: vTypeData, error: vTypeError } = await supabase
                .from('product_variants')
                .insert({ product_id: productId, name: vNameEn })
                .select()
                .single();

            if (vTypeError) {
                // Ignore unique constraint (if re-running) but here we delete/insert usually? 
                // For now log.
                // console.error('Variant Type Error:', vTypeError.message);
                continue;
            }

            // Insert Options
            for (const val of vValues) {
                // Find image
                const imgUrl = optionImageMap[val.toLowerCase()];

                await supabase.from('product_variant_options').insert({
                    variant_id: vTypeData.id,
                    value: val, // Keep value in original lang or translate? User said "Translate all data".
                    // But mapping image relies on Vietnamese value match.
                    // Let's store VN value for now, or translate AFTER mapping image?
                    // Let's keep VN value for exact match visually, or translate if simple.
                    image_url: imgUrl || null
                });
            }
        }

        success++;
        if (success % 10 === 0) console.log(`Imported ${success} products...`);
    }

    console.log('--- Import V2 Complete ---');
}

importV2();
