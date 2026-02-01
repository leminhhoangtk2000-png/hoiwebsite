const XLSX = require('xlsx');
const path = require('path');
const SALES_FILE = 'mass_update_sales_info_111608803_20260120023906.xlsx';
// Also checking Media for Category
const MEDIA_FILE = 'mass_update_media_info_111608803_20260120023826.xlsx';

function inspect(file, name) {
    const workbook = XLSX.readFile(file);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { range: 2 });

    console.log(`\n--- ${name} Data Sample (Rows with Product ID) ---`);
    const validRows = rows.filter(r => r['Mã Sản phẩm']).slice(0, 5);
    validRows.forEach(r => {
        if (name === 'Sales') {
            console.log(`ID: ${r['Mã Sản phẩm']} | VariantName: ${r['Tên phân loại']} | Price: ${r['Giá']} | Stock: ${r['Số lượng']}`);
        } else {
            console.log(`ID: ${r['Mã Sản phẩm']} | Category: ${r['Ngành hàng']}`);
        }
    });
}

inspect(SALES_FILE, 'Sales');
inspect(MEDIA_FILE, 'Media');
