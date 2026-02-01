const XLSX = require('xlsx');
const MEDIA_FILE = 'mass_update_media_info_111608803_20260120023826.xlsx';

const workbook = XLSX.readFile(MEDIA_FILE);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet, { range: 2 }); // Header is at index 2 (Row 3)

console.log('--- Media Data Sample ---');
// Filter for rows that look like real products (have a name)
const realRows = rows.filter(r => r['Tên Sản phẩm']).slice(0, 5);
realRows.forEach(r => {
    console.log(`SKU: ${r['SKU Sản phẩm']} | ID: ${r['Mã Sản phẩm']} | Name: ${r['Tên Sản phẩm']} | Opt1: ${r['Tên phân loại 1']} | Img1: ${r['Hình ảnh phân loại 1']}`);
});
