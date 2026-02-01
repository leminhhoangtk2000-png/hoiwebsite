const XLSX = require('xlsx');
const path = require('path');

const KV_FILE = 'DanhSachSanPham_KV20012026-020153-299.xlsx';

function inspectKV() {
    const workbook = XLSX.readFile(path.join(__dirname, KV_FILE));
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { range: 0 }); // Header Row 0

    // D2501 was found at index 70 in array (which is Row 71 in Excel if Row 1 is header?)
    // Let's print rows 69 to 75
    console.log('--- KV Rows 69-76 ---');
    for (let i = 69; i <= 76; i++) {
        if (rows[i]) {
            console.log(`Index ${i}:`);
            console.log(JSON.stringify(rows[i], null, 2));
        }
    }
}

inspectKV();
