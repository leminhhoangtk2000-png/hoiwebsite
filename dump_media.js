const XLSX = require('xlsx');
const path = require('path');

const MEDIA_FILE = 'mass_update_media_info_111608803_20260120023826.xlsx';

function dumpMedia() {
    const workbook = XLSX.readFile(path.join(__dirname, MEDIA_FILE));
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { range: 0 }); // Header Row 0

    console.log(`\n--- Media Rows 4-10 ---`);
    rows.slice(4, 10).forEach((r, i) => {
        console.log(`Row ${i + 4}:`, JSON.stringify(r));
    });
}

dumpMedia();
