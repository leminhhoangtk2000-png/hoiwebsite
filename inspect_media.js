const XLSX = require('xlsx');
const path = require('path');
const MEDIA_FILE = 'mass_update_media_info_111608803_20260120023826.xlsx';

const workbook = XLSX.readFile(MEDIA_FILE);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }); // Array of arrays

console.log('--- Media File First 5 Rows ---');
rows.slice(0, 5).forEach((row, i) => {
    console.log(`Row ${i}:`, row);
});
