const XLSX = require('xlsx');
const path = require('path');
const SALES_FILE = 'mass_update_sales_info_111608803_20260120023906.xlsx';

function inspectHeaders() {
    const workbook = XLSX.readFile(SALES_FILE);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }); // Array of arrays

    console.log('--- Sales Info Headers (Row 2) ---');
    if (rows.length > 2) {
        rows[2].forEach((h, i) => {
            console.log(`Index ${i}: ${h}`);
        });
    }

    console.log('\n--- Checking for Multi-Dimension Variants ---');
    // detailed scan
    const data = XLSX.utils.sheet_to_json(sheet, { range: 2 });
    const multiDim = data.find(r => r['Tên phân loại'] && (r['Tên phân loại'].includes(',') || r['Tên phân loại'].includes('-')));
    if (multiDim) {
        console.log('Found Multi-Dim Sample:', multiDim['Tên phân loại']);
        console.log('Full Row:', multiDim);
    } else {
        console.log('No obvious multi-dimension strings found (checked for comma/dash).');
    }
}

inspectHeaders();
