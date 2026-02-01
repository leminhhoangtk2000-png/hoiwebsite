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
async function importV4() {
    console.log('--- Starting Import V4 (Fix Images with VN Headers + Name Match) ---');
    console.log('Reading files...');
    const kvData = readExcel(KV_FILE, 0);
    // Media file headers are at Row 2 (index 2)
    const mediaData = readExcel(MEDIA_FILE, 2);

    // --- STEP 0: CLEAR OLD DATA ---
    console.log('Clearing old data (variants, products)...');
    await supabase.from('product_variant_options').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('product_variants').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('product_images').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log('Data cleared.');

    // --- STEP 1: CATEGORIES ---
    console.log('\n--- Processing Categories ---');
    const categoriesSet = new Set();
    kvData.forEach(row => {
        const cat = row['Nhóm hàng(3 Cấp)'];
        if (cat) categoriesSet.add(cat.trim());
    });

    const categoryMap = {};

    for (const catNameVn of categoriesSet) {
        let catNameEn = await safeTranslate(catNameVn);
        let slug = generateSlug(catNameEn);

        const { data } = await supabase.from('categories').select('id, name').eq('slug', slug).single();
        if (data) {
            categoryMap[catNameVn] = data.id;
        } else {
            const { data: newData, error } = await supabase.from('categories').insert({ name: catNameEn, slug: slug }).select().single();
            if (newData) categoryMap[catNameVn] = newData.id;
        }
    }

    // --- STEP 2: BUILD MEDIA MAP ---
    console.log('\n--- Building Media Map ---');
    const mediaMap = {};
    const mediaList = [];
    mediaData.forEach(row => {
        // VN Header Keys
        const pSku = row['SKU Sản phẩm'];
        if (pSku) mediaMap[pSku.toString().trim()] = row;

        const pid = row['Mã Sản phẩm'];
        if (pid) mediaMap[pid.toString().trim()] = row;

        // Also keep list for Name matching
        if (row['Tên Sản phẩm']) mediaList.push(row);
    });

    // --- STEP 3: GROUP PRODUCTS ---
    console.log('\n--- Grouping Products ---');
    const groups = {};
    kvData.forEach(row => {
        const code = row['Mã hàng'];
        const parent = row['Mã HH Liên quan'];
        let groupKey = parent || code;
        if (!groups[groupKey]) groups[groupKey] = [];
        groups[groupKey].push(row);
    });

    // --- STEP 4: INSERT PRODUCTS & VARIANTS ---
    console.log('\n--- Importing Products ---');
    let successCount = 0;
    let nameMatchCount = 0;
    const groupKeys = Object.keys(groups);

    global.skuMap = {};

    for (let i = 0; i < groupKeys.length; i++) {
        const gid = groupKeys[i];
        const rows = groups[gid];
        const mainRow = rows.find(r => !r['Mã HH Liên quan']) || rows[0];

        const nameVn = mainRow['Tên hàng'];
        const catVn = mainRow['Nhóm hàng(3 Cấp)'];
        const priceVnd = mainRow['Giá bán'] || 0;
        const priceUsd = parseFloat((priceVnd / EXCHANGE_RATE).toFixed(2));
        const categoryId = categoryMap[catVn?.trim()];
        const nameEn = await safeTranslate(nameVn);

        // Robust Media Find
        const groupSkus = new Set();
        rows.forEach(r => {
            if (r['Mã hàng']) groupSkus.add(String(r['Mã hàng']).trim());
            if (r['Mã HH Liên quan']) groupSkus.add(String(r['Mã HH Liên quan']).trim());
        });

        let mediaRow = null;
        // 1. Try SKU Match
        for (const sku of groupSkus) {
            if (mediaMap[sku]) {
                mediaRow = mediaMap[sku];
                break;
            }
        }

        // 2. Try Name Match
        if (!mediaRow) {
            const kvNameLower = nameVn.toLowerCase().trim();
            const kvTokens = kvNameLower.split(/\s+/).filter(t => t.length > 0);

            for (const row of mediaList) {
                const mediaNameLower = row['Tên Sản phẩm'].toLowerCase();
                // Check if ALL KV tokens exist in Media Name
                const isMatch = kvTokens.every(token => mediaNameLower.includes(token));
                if (isMatch) {
                    mediaRow = row;
                    nameMatchCount++;
                    // console.log(`Name Match: "${nameVn}" -> "${row['Tên Sản phẩm']}"`);
                    break;
                }
            }
        }

        let mainImage = null;
        if (mediaRow) {
            mainImage = mediaRow['Ảnh bìa'];
        }

        // Insert Product
        const { data: prodData, error: prodError } = await supabase
            .from('products')
            .insert({
                name: nameEn || nameVn,
                description: '',
                price_vnd: priceVnd,
                price_usd: priceUsd,
                category_id: categoryId,
                main_image_url: mainImage
            })
            .select()
            .single();

        if (prodError) {
            console.error(`Error inserting product ${gid}:`, prodError.message);
            continue;
        }

        const productId = prodData.id;
        global.skuMap[productId] = gid;

        // --- VARIANTS ---
        const optionImageMap = {};
        if (mediaRow) {
            for (let j = 1; j <= 20; j++) {
                const optVal = mediaRow[`Tên phân loại ${j}`];
                const optImg = mediaRow[`Hình ảnh phân loại ${j}`];
                if (optVal && optImg) {
                    optionImageMap[optVal.toLowerCase().trim()] = optImg;
                }
            }
        }

        const variantMap = {};
        for (const r of rows) {
            const attrStr = r['Thuộc tính'];
            if (!attrStr) continue;
            const parts = attrStr.split('|');
            parts.forEach(p => {
                let [key, val] = p.split(':');
                if (key && val) {
                    key = key.trim();
                    val = val.trim();
                    if (!variantMap[key]) variantMap[key] = new Set();
                    variantMap[key].add(val);
                }
            });
        }

        for (const [vName, vValues] of Object.entries(variantMap)) {
            let vNameEn = vName;
            if (vName.toLowerCase().includes('màu')) vNameEn = 'Color';
            if (vName.toLowerCase().includes('kích') || vName.toLowerCase().includes('size')) vNameEn = 'Size';

            const { data: vTypeData, error: vTypeError } = await supabase
                .from('product_variants')
                .insert({ product_id: productId, name: vNameEn })
                .select()
                .single();

            if (vTypeError) continue;

            for (const val of vValues) {
                let imgUrl = optionImageMap[val.toLowerCase()];
                if (!imgUrl) {
                    const simpleVal = val.replace('Màu ', '').trim().toLowerCase();
                    imgUrl = optionImageMap[simpleVal];
                }

                await supabase.from('product_variant_options').insert({
                    variant_id: vTypeData.id,
                    value: val,
                    image_url: imgUrl || null
                });
            }
        }

        successCount++;
        if (successCount % 10 === 0) console.log(`Imported ${successCount} products...`);
    }

    fs.writeFileSync('product_sku_map.json', JSON.stringify(global.skuMap, null, 2));
    console.log(`--- Import V4 Complete. Success: ${successCount} (NameMatched: ${nameMatchCount}) ---`);
}

importV4();
