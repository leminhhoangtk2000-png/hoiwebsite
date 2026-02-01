const XLSX = require('xlsx');
const path = require('path');

const FILES = [
    'mass_update_basic_info_111608803_20260120023837.xlsx',
    'mass_update_sales_info_111608803_20260120023906.xlsx'
];

FILES.forEach(file => {
    const filePath = path.join(__dirname, file);
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    console.log(`\n--- File: ${file} ---`);
    if (rows.length > 3) {
        console.log('Row 0:', rows[0]);
        console.log('Row 1:', rows[1]);
        console.log('Row 2 (Likely Header):', rows[2]);
        console.log('Row 3 (First Data):', rows[3]); // Sample data
    } else {
        console.log('Not enough rows.');
    }
});
