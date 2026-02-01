require('dotenv').config({ path: '.env.local' }); // Load from .env.local
const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// --- CONFIGURATION ---
const FILE_PATH = path.join(__dirname, 'shopee_data.xlsx');
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// --- VALIDATION ---
if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Error: Missing Supabase credentials in .env.local');
    console.error('Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.');
    process.exit(1);
}

if (!fs.existsSync(FILE_PATH)) {
    console.error(`Error: File not found at ${FILE_PATH}`);
    process.exit(1);
}

// --- INITIALIZE SUPABASE ---
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- HELPER FUNCTIONS ---
function cleanPrice(rawPrice) {
    if (!rawPrice) return 0;
    // If it's already a number, return it
    if (typeof rawPrice === 'number') return rawPrice;

    // Remove all non-numeric chars except possible negative sign (though price shouldn't be negative)
    const cleaned = rawPrice.toString().replace(/[^0-9]/g, '');
    return parseInt(cleaned, 10) || 0;
}

function cleanImageUrl(url) {
    if (!url || typeof url !== 'string') return null;
    if (url.startsWith('http')) return url;
    return null;
}

// --- MAIN FUNCTION ---
async function importData() {
    console.log('Reading Excel file...');
    const workbook = XLSX.readFile(FILE_PATH);
    const sheetName = workbook.SheetNames[0]; // Assuming first sheet
    const sheet = workbook.Sheets[sheetName];

    // Convert to JSON
    const rawData = XLSX.utils.sheet_to_json(sheet);
    console.log(`Found ${rawData.length} rows.`);

    const productsToInsert = rawData.map(row => {
        // Log row for debugging if needed
        // console.log(row);

        // Mappings based on User Request
        // Note: Accessing keys by exact string match from Excel headers
        const name = row['Tên sản phẩm'] || 'Untitled Product';
        const price = cleanPrice(row['Giá']);
        const description = row['Mô tả sản phẩm'] || '';
        const main_image_url = cleanImageUrl(row['Hình ảnh 1']);
        const category = 'Uniqlo'; // Hardcoded per requirement

        return {
            name,
            price,
            description,
            main_image_url,
            category
        };
    });

    // Batch insert to avoid hitting limits (e.g., 50 at a time)
    const BATCH_SIZE = 50;
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < productsToInsert.length; i += BATCH_SIZE) {
        const batch = productsToInsert.slice(i, i + BATCH_SIZE);
        console.log(`Inserting batch ${i / BATCH_SIZE + 1}...`);

        const { data, error } = await supabase
            .from('products')
            .insert(batch);

        if (error) {
            console.error('Batch Insert Error:', error.message);
            failCount += batch.length;
        } else {
            successCount += batch.length;
        }
    }

    console.log('--- Import Finished ---');
    console.log(`Successfully imported: ${successCount}`);
    console.log(`Failed: ${failCount}`);
}

importData();
