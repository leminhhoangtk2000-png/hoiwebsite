const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const mediaFile = 'mass_update_media_info_111608803_20260120023826.xlsx';
const salesFile = 'mass_update_sales_info_111608803_20260120023906.xlsx';

function inspectFile(filename) {
    const filePath = path.join(__dirname, filename);
    if (!fs.existsSync(filePath)) {
        console.log(`File not found: ${filename}`);
        return;
    }
    console.log(`\n--- Inspecting ${filename} ---`);
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Get headers (first row or based on Shopee format usually row 1 or 2/3)
    // Shopee exports often have instructional rows at the top. We'll grab the first 5 rows to see structure.
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, range: 0, defval: null });

    // Print first 5 rows to identify header row
    rows.slice(0, 5).forEach((row, i) => {
        console.log(`Row ${i}:`, JSON.stringify(row));
    });
}

inspectFile(mediaFile);
inspectFile(salesFile);
