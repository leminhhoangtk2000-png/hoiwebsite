require('dotenv').config({ path: '.env.local' });
const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const translate = require('google-translate-api-x');

// --- CONFIGURATION ---
const FILES = {
    KV: 'DanhSachSanPham_KV20012026-020153-299.xlsx',
    BASIC: 'mass_update_basic_info_111608803_20260120023837.xlsx',
    MEDIA: 'mass_update_media_info_111608803_20260120023826.xlsx',
    SALES: 'mass_update_sales_info_111608803_20260120023906.xlsx'
};
const EXCHANGE_RATE = 25400; // 1 USD = 25,400 VND (Approx)

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Error: Missing Supabase credentials.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- HELPER FUNCTIONS ---
function readExcel(filename, headerRowIndex = 0) {
    const filePath = path.join(__dirname, filename);
    if (!fs.existsSync(filePath)) {
        console.warn(`Warning: File not found ${filename}`);
        return [];
    }
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json(sheet, { range: headerRowIndex });
}

function cleanPrice(raw) {
    if (!raw) return 0;
    if (typeof raw === 'number') return raw;
    const cleaned = raw.toString().replace(/[^0-9]/g, '');
    return parseInt(cleaned, 10) || 0;
}

// Simple translation wrap to handle errors/limits
async function safeTranslate(text) {
    if (!text) return '';
    try {
        const res = await translate(text, { to: 'en' });
        return res.text;
    } catch (e) {
        // console.warn(`Translation failed for "${text.substring(0, 20)}...": ${e.message}`);
        return text; // Fallback to original
    }
}

async function startImport() {
    console.log('Reading files...');

    // 1. Read KiotViet (Row 0 is header)
    const kvData = readExcel(FILES.KV, 0);
    // Create map: SKU -> Category (Nhóm hàng)
    // SKU col: "Mã hàng", Category col: "Nhóm hàng(3 Cấp)"
    const kvMap = {};
    kvData.forEach(row => {
        const sku = row['Mã hàng'];
        if (sku) kvMap[sku] = row['Nhóm hàng(3 Cấp)'];
    });
    console.log(`Loaded ${Object.keys(kvMap).length} KiotViet SKUs.`);

    // 2. Read Shopee Basic Info (Row 0 has technical keys)
    const basicData = readExcel(FILES.BASIC, 0);
    // Map: ProductID -> { Description, SKU }
    const basicMap = {};
    basicData.forEach(row => {
        const pid = row['et_title_product_id'];
        if (!pid || pid === 'basic_info' || pid === 'Mã Sản phẩm') return;

        basicMap[pid] = {
            description: row['et_title_product_description'],
            sku: row['et_title_parent_sku']
        };
    });

    // 3. Read Shopee Sales (Price)
    const salesData = readExcel(FILES.SALES, 0);
    // Map: ProductID -> Price
    const salesMap = {};
    salesData.forEach(row => {
        const pid = row['et_title_product_id'];
        if (!pid) return;
        const price = cleanPrice(row['et_title_variation_price']);
        if (!salesMap[pid] || (salesMap[pid] === 0 && price > 0)) {
            salesMap[pid] = price;
        }
    });

    // 4. Read Shopee Media (Images + Main loop items)
    const mediaData = readExcel(FILES.MEDIA, 0);

    const products = [];
    const processedIds = new Set();

    console.log('Processing and Translating data (this may take a while)...');

    for (const row of mediaData) {
        const pid = row['et_title_product_id'];
        if (!pid || processedIds.has(pid)) continue;
        if (pid === 'Mã Sản phẩm' || pid === 'Product ID') continue;

        const nameVn = row['et_title_product_name'];
        if (!nameVn) continue;

        // Get merged data
        const basic = basicMap[pid] || {};
        const descriptionVn = basic.description || row['et_title_description'] || '';
        const sku = basic.sku; // Parent SKU from Basic Info

        const priceVnd = salesMap[pid] || 0;

        // Get Category from KiotViet via SKU
        // KiotViet SKU might match Shopee Parent SKU exactly?
        let categoryVn = 'Uniqlo'; // Default
        if (sku && kvMap[sku]) {
            categoryVn = kvMap[sku];
        } else {
            // Try to match partial? 
            // Maybe Shopee SKU is different. Let's assume strict match first.
        }

        // Translation
        const [nameEn, descEn, catEn] = await Promise.all([
            safeTranslate(nameVn),
            safeTranslate(descriptionVn),
            safeTranslate(categoryVn)
        ]);

        // Currency
        const priceUsd = parseFloat((priceVnd / EXCHANGE_RATE).toFixed(2));

        // Images
        let main_image_url = row['et_title_image_cover'];
        if (!main_image_url || !main_image_url.startsWith('http')) {
            main_image_url = row['et_title_image1'];
        }
        if (main_image_url && !main_image_url.startsWith('http')) main_image_url = null;

        products.push({
            name: nameEn || nameVn,
            price_vnd: priceVnd,
            price_usd: priceUsd,
            description: descEn || descriptionVn,
            category: catEn || categoryVn,
            main_image_url
        });

        processedIds.add(pid);

        // Log progress every 20 items
        if (products.length % 20 === 0) console.log(`Processed ${products.length} items...`);
    }

    console.log(`Ready to insert ${products.length} products.`);

    if (products.length === 0) {
        console.log('No products found to insert.');
        return;
    }

    // Insert to Supabase
    const BATCH_SIZE = 50;
    let success = 0;
    let failed = 0;

    for (let i = 0; i < products.length; i += BATCH_SIZE) {
        const batch = products.slice(i, i + BATCH_SIZE);
        const { error } = await supabase.from('products').insert(batch);

        if (error) {
            console.error(`Batch ${i / BATCH_SIZE + 1} Error:`, error.message);
            failed += batch.length;
        } else {
            success += batch.length;
        }
    }

    console.log('--- Import Final Report ---');
    console.log(`Successfully Imported: ${success}`);
    console.log(`Failed: ${failed}`);
}

startImport();
