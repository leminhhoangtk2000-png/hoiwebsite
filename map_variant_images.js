require('dotenv').config({ path: '.env.local' });
const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const translate = require('google-translate-api-x');

// --- CONFIGURATION ---
const KV_FILE = 'DanhSachSanPham_KV20012026-020153-299.xlsx';
const MEDIA_FILE = 'mass_update_media_info_111608803_20260120023826.xlsx';

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

async function mapImages() {
    console.log('--- Starting Variant Image Mapping ---');

    // 1. Read Data
    const kvData = readExcel(KV_FILE, 0);
    const mediaData = readExcel(MEDIA_FILE, 0);

    // 2. Build Media Map: ParentSKU -> { OptionValueLowerCase: ImageURL }
    const mediaMap = {};
    mediaData.forEach(row => {
        const pSku = row['et_title_parent_sku'];
        if (!pSku) return;

        if (!mediaMap[pSku]) mediaMap[pSku] = {};

        // Extract option images
        for (let k = 1; k <= 20; k++) {
            // We need to iterate all options for all variations
            for (let j = 1; j <= 50; j++) {
                const optVal = row[`et_title_option_${j}_for_variation_${k}`];
                const optImg = row[`et_title_option_image_${j}_for_variation_${k}`];
                if (optVal && optImg) {
                    mediaMap[pSku][optVal.toLowerCase().trim()] = optImg;
                }
            }
        }
    });

    // 3. Build KV Map: TranslatedName -> SKU
    console.log('Building KV Name Map (Translating)...');
    const nameToSku = {};
    const seenNames = new Set();

    // Optimizing: Group KV by name first to avoid re-translating same name
    const distinctKvRows = [];
    kvData.forEach(row => {
        const name = row['Tên hàng'];
        if (name && !seenNames.has(name)) {
            seenNames.add(name);
            distinctKvRows.push({ name, sku: row['Mã hàng'], parent: row['Mã HH Liên quan'] });
        }
    });

    for (const item of distinctKvRows) {
        const enName = await safeTranslate(item.name);
        const sku = item.parent || item.sku; // Use parent SKU if available to link to Media Group
        nameToSku[enName.toLowerCase()] = sku;
    }
    console.log(`Mapped ${Object.keys(nameToSku).length} unique product names to SKUs.`);

    // 4. Fetch DB Products
    const { data: products, error: prodError } = await supabase
        .from('products')
        .select(`
            id, 
            name, 
            product_variants (
                id,
                name,
                product_variant_options (
                    id,
                    value,
                    image_url
                )
            )
        `);

    if (prodError) {
        console.error('Error fetching products:', prodError);
        return;
    }

    console.log(`Found ${products.length} products in DB.`);

    // 5. Update Images
    let updatedCount = 0;

    for (const product of products) {
        const dbName = product.name.toLowerCase();
        const sku = nameToSku[dbName];

        if (!sku) {
            console.log(`No SKU found for DB Product: "${product.name}"`);
            continue;
        }

        const imageMap = mediaMap[sku];
        if (!imageMap) {
            // console.log(`No Media found for SKU: ${sku} (Product: ${product.name})`);
            continue;
        }

        // Iterate Variants
        for (const variant of product.product_variants) {
            for (const option of variant.product_variant_options) {
                const optVal = option.value.toLowerCase().trim();
                const newImage = imageMap[optVal];

                if (newImage && newImage !== option.image_url) {
                    // Update
                    const { error } = await supabase
                        .from('product_variant_options')
                        .update({ image_url: newImage })
                        .eq('id', option.id);

                    if (!error) {
                        updatedCount++;
                        // console.log(`Updated ${product.name} - ${option.value}`);
                    }
                }
            }
        }
    }

    console.log(`--- Finished. Updated ${updatedCount} variant options. ---`);
}

mapImages();
