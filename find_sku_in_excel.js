const XLSX = require('xlsx');
const path = require('path');

const MEDIA_FILE = 'DanhSachSanPham_KV20012026-020153-299.xlsx'; // Search in KV
const TARGET_VAL = 'D2501';

function findValue() {
    const workbook = XLSX.readFile(path.join(__dirname, MEDIA_FILE));
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }); // Array of arrays

    console.log(`Searching for "${TARGET_VAL}" in ${data.length} rows...`);

    let found = false;
    data.forEach((row, rIndex) => {
        row.forEach((cell, cIndex) => {
            if (String(cell).includes(TARGET_VAL)) {
                console.log(`Found at Row ${rIndex}, Col ${cIndex}: ${cell}`);
                // Print header for this col
                const header = data[0][cIndex];
                console.log(`Header (Row 0): ${header}`);
                found = true;
            }
        });
    });

    if (!found) console.log('Not found.');
}

findValue();
