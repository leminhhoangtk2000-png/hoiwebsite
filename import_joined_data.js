require('dotenv').config({ path: '.env.local' });
const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// --- CONFIGURATION ---
const MEDIA_FILE = 'mass_update_media_info_111608803_20260120023826.xlsx';
const SALES_FILE = 'mass_update_sales_info_111608803_20260120023906.xlsx';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// --- VALIDATION ---
if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Error: Missing Supabase credentials in .env.local');
    process.exit(1);
}

// --- SUPABASE CLIENT ---
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- HELPER FUNCTIONS ---
function readExcel(filename) {
    const filePath = path.join(__dirname, filename);
    if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filename}`);
    }
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    // Read with header: 0 (uses first row as keys) which matches the technical keys in Row 0
    return XLSX.utils.sheet_to_json(sheet);
}

function cleanPrice(rawPrice) {
    if (!rawPrice) return 0;
    if (typeof rawPrice === 'number') return rawPrice;
    const cleaned = rawPrice.toString().replace(/[^0-9]/g, '');
    return parseInt(cleaned, 10) || 0;
}

function getValidImage(row) {
    // Try Cover Image first, then Image 1
    const cover = row['et_title_image_cover'];
    const img1 = row['et_title_image1'];

    if (cover && cover.startsWith('http')) return cover;
    if (img1 && img1.startsWith('http')) return img1;

    return null;
}

// --- MAIN ---
async function importUnifiedData() {
    console.log('Reading Excel files...');

    let mediaData, salesData;
    try {
        mediaData = readExcel(MEDIA_FILE);
        salesData = readExcel(SALES_FILE);
    } catch (e) {
        console.error(e.message);
        process.exit(1);
    }

    console.log(`Media Rows: ${mediaData.length}`);
    console.log(`Sales Rows: ${salesData.length}`);

    // Map Sales Data by Product ID (taking the first price found for a product ID if duplicates exist)
    const salesMap = {};
    salesData.forEach(row => {
        const pid = row['et_title_product_id'];
        if (!pid) return; // skip empty rows

        // We prioritize the main product entry (Variation ID 0) if usually listed, 
        // or just take the first valid price we find.
        const price = cleanPrice(row['et_title_variation_price']);

        // If not in map or we found a non-zero price to overwrite a zero price?
        if (!salesMap[pid] || (salesMap[pid] === 0 && price > 0)) {
            salesMap[pid] = price;
        }
    });

    // Process Media Data (Main source of products)
    const productsToInsert = [];

    // Check duplicates to avoid inserting same product ID twice
    const processedIds = new Set();

    mediaData.forEach(row => {
        const pid = row['et_title_product_id'];
        if (!pid || processedIds.has(pid)) return; // Skip duplicates or empty

        // Check if this is a header row or garbage (sometimes exports have multiple header rows)
        if (pid === 'Mã Sản phẩm' || pid === 'Product ID') return;

        const name = row['et_title_product_name'];
        if (!name) return; // Must have name

        const description = row['et_title_description'] || '';
        const main_image_url = getValidImage(row);
        const price = salesMap[pid] || 0;
        const category = 'Uniqlo'; // Hardcoded

        productsToInsert.push({
            name,
            price_vnd: price, // Map to VND
            price_usd: 0,     // Default to 0 to satisfy NOT NULL constraint
            description,
            main_image_url,
            category
        });

        processedIds.add(pid);
    });

    console.log(`Prepared ${productsToInsert.length} unique products for import.`);

    if (productsToInsert.length === 0) {
        console.log('No products found. Checking if header keys matched...');
        console.log('Sample Row Keys:', Object.keys(mediaData[0] || {}));
        return;
    }

    // Insert to Supabase
    const BATCH_SIZE = 50;
    let success = 0;
    let failed = 0;

    for (let i = 0; i < productsToInsert.length; i += BATCH_SIZE) {
        const batch = productsToInsert.slice(i, i + BATCH_SIZE);
        console.log(`Inserting batch ${Math.floor(i / BATCH_SIZE) + 1}...`);

        const { error } = await supabase.from('products').insert(batch);

        if (error) {
            console.error('Insert Error:', error.message);
            failed += batch.length;
        } else {
            success += batch.length;
        }
    }

    console.log('--- Import Complete ---');
    console.log(`Success: ${success}`);
    console.log(`Failed: ${failed}`);
}

importUnifiedData();
