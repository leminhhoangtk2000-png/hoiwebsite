const XLSX = require('xlsx');
const path = require('path');
const MEDIA_FILE = 'mass_update_media_info_111608803_20260120023826.xlsx';

function inspectMediaHeaders() {
    const workbook = XLSX.readFile(MEDIA_FILE);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    console.log('--- Media Info Headers (Row 2) ---');
    if (rows.length > 2) {
        rows[2].forEach((h, i) => {
            if (h && (h.includes('Nhóm') || h.includes('phân loại'))) {
                console.log(`Index ${i}: ${h}`);
            }
        });
    }
}

inspectMediaHeaders();
