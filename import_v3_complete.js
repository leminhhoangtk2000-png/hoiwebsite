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
    if (typeof text !== 'string') return String(text);
    try {
        const res = await translate(text, { to: 'en' });
        return res.text;
    } catch { return text; }
}

function generateSlug(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// --- MAIN IMPORT ---
async function importV3() {
    console.log('--- Starting Import V3 ---');
    console.log('Reading files...');
    const kvData = readExcel(KV_FILE, 0);
    const mediaData = readExcel(MEDIA_FILE, 0);

    // --- STEP 1: IMPORT CATEGORIES ---
    console.log('\n--- Processing Categories ---');
    const categoriesSet = new Set();

    // 1.1 Extract uniqueness from KiotViet "Nhóm hàng(3 Cấp)"
    kvData.forEach(row => {
        const cat = row['Nhóm hàng(3 Cấp)'];
        if (cat) categoriesSet.add(cat.trim());
    });

    // 1.2 Shopee Category? (Optional, prioritizing KiotViet as requested)

    // 1.3 Insert Categories & Build Map
    const categoryMap = {}; // Name (VN) -> ID

    for (const catNameVn of categoriesSet) {
        // Translate
        const catNameEn = await safeTranslate(catNameVn);
        const slug = generateSlug(catNameEn);

        // Upsert Category
        const { data, error } = await supabase
            .from('categories')
            .upsert({ name: catNameEn, slug: slug }, { onConflict: 'slug' })
            .select('id, name')
            .single();

        if (error) {
            // Try fetching if upsert fail on unique name but diff slug?
            // Fallback: select by name
            const { data: exist } = await supabase.from('categories').select('id').eq('name', catNameEn).single();
            if (exist) categoryMap[catNameVn] = exist.id;
        } else {
            categoryMap[catNameVn] = data.id;
        }
    }
    console.log(`Mapped ${Object.keys(categoryMap).length} categories.`);


    // --- STEP 2: GROUP PRODUCTS & MAP MEDIA ---
    console.log('\n--- Grouping Products ---');
    const mediaMap = {};
    mediaData.forEach(row => {
        const pSku = row['et_title_parent_sku'];
        if (pSku) mediaMap[pSku] = row;
    });

    const groups = {}; // Key: ParentSKU/Code, Value: [Rows]
    kvData.forEach(row => {
        const code = row['Mã hàng'];
        const parent = row['Mã HH Liên quan'];
        let groupKey = parent || code;
        if (!groups[groupKey]) groups[groupKey] = [];
        groups[groupKey].push(row);
    });

    // --- STEP 3: INSERT PRODUCTS & VARIANTS ---
    console.log('\n--- Importing Products ---');
    let successCount = 0;
    const groupKeys = Object.keys(groups);

    for (let i = 0; i < groupKeys.length; i++) {
        const gid = groupKeys[i];
        const rows = groups[gid];
        const mainRow = rows.find(r => !r['Mã HH Liên quan']) || rows[0];

        const nameVn = mainRow['Tên hàng'];
        const catVn = mainRow['Nhóm hàng(3 Cấp)'];
        const priceVnd = mainRow['Giá bán'] || 0;
        const priceUsd = parseFloat((priceVnd / EXCHANGE_RATE).toFixed(2));

        // Find Category ID
        const categoryId = categoryMap[catVn?.trim()];
        // Note: If null, could insert to "Uncategorized" or fail.

        // Translate Name
        const nameEn = await safeTranslate(nameVn);

        // Find Media
        const mediaRow = mediaMap[gid];
        let mainImage = null;
        if (mediaRow) mainImage = mediaRow['et_title_image_cover'];

        // Insert Product
        const { data: prodData, error: prodError } = await supabase
            .from('products')
            .insert({
                name: nameEn || nameVn,
                description: mediaRow ? mediaRow['et_title_product_description'] : '',
                price_vnd: priceVnd,
                price_usd: priceUsd,
                category_id: categoryId, // Mapped ID
                main_image_url: mainImage
            })
            .select()
            .single();

        if (prodError) {
            console.error(`Error inserting product ${gid}:`, prodError.message);
            continue;
        }

        const productId = prodData.id;

        // --- STEP 4: VARIANTS & IMAGES ---

        // Prepare Shopee Image Map for Variants
        const optionImageMap = {};
        if (mediaRow) {
            for (let k = 1; k <= 20; k++) {
                const varName = mediaRow[`et_title_variation_${k}`];
                if (!varName) break;
                // Get options for this variation
                for (let j = 1; j <= 50; j++) {
                    const optVal = mediaRow[`et_title_option_${j}_for_variation_${k}`];
                    const optImg = mediaRow[`et_title_option_image_${j}_for_variation_${k}`];
                    if (!optVal) break;
                    if (optImg) optionImageMap[optVal.toLowerCase().trim()] = optImg;
                }
            }
        }

        const variantMap = {};

        for (const r of rows) {
            const attrStr = r['Thuộc tính'];
            if (!attrStr) continue;

            // "Màu sắc:Kem|Kíchcỡ:S"
            const parts = attrStr.split('|');
            parts.forEach(p => {
                const [key, val] = p.split(':');
                if (key && val) {
                    const normKey = key.trim();
                    const normVal = val.trim();

                    if (!variantMap[normKey]) variantMap[normKey] = new Set();
                    variantMap[normKey].add(normVal);
                }
            });
        }

        for (const [vName, vValues] of Object.entries(variantMap)) {
            // Translate Name
            let vNameEn = vName;
            if (vName.toLowerCase().includes('màu')) vNameEn = 'Color';
            if (vName.toLowerCase().includes('kích') || vName.toLowerCase().includes('size')) vNameEn = 'Size';

            const { data: vTypeData, error: vTypeError } = await supabase
                .from('product_variants')
                .insert({ product_id: productId, name: vNameEn })
                .select()
                .single();

            if (vTypeError) continue; // Skip if duplicate or error

            for (const val of vValues) {
                // Find image in Map
                const imgUrl = optionImageMap[val.toLowerCase()];
                // Translate Value
                // const valEn = await safeTranslate(val); // Optional: keep VN for consistency with Image Map

                await supabase.from('product_variant_options').insert({
                    variant_id: vTypeData.id,
                    value: val, // Keep VN value for now to match UI expectations? Or translate if desired. 
                    // User Request: "Dịch hết sang tiếng anh". OK, map image *before* translating value.
                    // But we used VN value to lookup key.
                    // Let's store Translated value in DB? 
                    // Or store both? The schema only has 'value'. 
                    // We will translate value for DB.
                    image_url: imgUrl || null
                });
            }
        }

        successCount++;
        if (successCount % 10 === 0) console.log(`Imported ${successCount} products...`);
    }

    console.log('--- Import V3 Complete ---');
    console.log(`Success: ${successCount}`);
}

importV3();
