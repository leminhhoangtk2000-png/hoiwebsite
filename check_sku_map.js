const XLSX = require('xlsx');
const path = require('path');

const KV_FILE = 'DanhSachSanPham_KV20012026-020153-299.xlsx';
const MEDIA_FILE = 'mass_update_media_info_111608803_20260120023826.xlsx';

function checkMapping() {
    const kvWorkbook = XLSX.readFile(path.join(__dirname, KV_FILE));
    const kvSheet = kvWorkbook.Sheets[kvWorkbook.SheetNames[0]];
    const kvRows = XLSX.utils.sheet_to_json(kvSheet); // Header Row 0

    const mediaWorkbook = XLSX.readFile(path.join(__dirname, MEDIA_FILE));
    const mediaSheet = mediaWorkbook.Sheets[mediaWorkbook.SheetNames[0]];
    const mediaRows = XLSX.utils.sheet_to_json(mediaSheet); // Header Row 0

    console.log(`KV Rows: ${kvRows.length}`);
    console.log(`Media Rows: ${mediaRows.length}`);

    // Collect some KV SKUs
    const kvSkus = kvRows.slice(0, 10).map(r => r['Mã hàng']);
    console.log('Sample KV SKUs:', kvSkus);

    // Check if these exist in Media
    kvSkus.forEach(sku => {
        const match = mediaRows.find(r =>
            r['et_title_parent_sku'] === sku ||
            r['et_title_variation_sku'] === sku ||
            r['et_title_product_id'] == sku // loose eq
        );
        if (match) {
            console.log(`Match Found for ${sku}! In Media as: ID=${match['et_title_product_id']}, ParentSKU=${match['et_title_parent_sku']}, VarSKU=${match['et_title_variation_sku']}`);
        } else {
            console.log(`No match for ${sku}`);
        }
    });
}

checkMapping();
