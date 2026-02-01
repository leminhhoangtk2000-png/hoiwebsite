require('dotenv').config({ path: '.env.local' });
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// --- CONFIGURATION ---
const KV_FILE = 'DanhSachSanPham_KV20012026-020153-299.xlsx';
const MEDIA_FILE = 'mass_update_media_info_111608803_20260120023826.xlsx';

const TARGET_NAME = "NAM HOA";

function readExcel(filename, headerRow = 0) {
    const filePath = path.join(__dirname, filename);
    const workbook = XLSX.readFile(filePath);
    return XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { range: headerRow });
}

function debug() {
    console.log(`--- Debugging Mapping for "${TARGET_NAME}" ---`);

    // 1. Find in KV
    const kvData = readExcel(KV_FILE, 0);
    const kvRows = kvData.filter(r => r['Tên hàng'] && r['Tên hàng'].toLowerCase().includes(TARGET_NAME.toLowerCase()));

    console.log(`Found ${kvRows.length} KV rows.`);

    const groupSkus = new Set();
    const variantMap = {};

    kvRows.forEach(r => {
        if (r['Mã hàng']) groupSkus.add(String(r['Mã hàng']).trim());
        if (r['Mã HH Liên quan']) groupSkus.add(String(r['Mã HH Liên quan']).trim());

        const attrStr = r['Thuộc tính'];
        if (attrStr) {
            const parts = attrStr.split('|');
            parts.forEach(p => {
                const [k, v] = p.split(':');
                if (v) {
                    const key = v.trim().toLowerCase();
                    if (!variantMap[key]) variantMap[key] = [];
                    variantMap[key].push(r['Mã hàng']);
                }
            });
        }
    });

    console.log('Group SKUs:', [...groupSkus]);
    console.log('KV Option Values:', Object.keys(variantMap));

    // 2. Find in Media (Header Row 2)
    const mediaData = readExcel(MEDIA_FILE, 2);

    let mediaRow = null;
    let matchType = null;

    for (const row of mediaData) {
        const pSku = row['SKU Sản phẩm'] ? String(row['SKU Sản phẩm']).trim() : '';
        const pid = row['Mã Sản phẩm'] ? String(row['Mã Sản phẩm']).trim() : '';

        if (groupSkus.has(pSku) || groupSkus.has(pid)) {
            mediaRow = row;
            matchType = `SKU ${pSku || pid}`;
            break;
        }
    }

    if (!mediaRow) {
        console.log('❌ No Media Row found via SKU!');
        return;
    }

    console.log(`✅ MATCH FOUND! Media Row (via ${matchType})`);
    console.log(`Media Name: ${mediaRow['Tên Sản phẩm']}`);

    // 3. Option Map
    console.log('--- Media Row Options ---');
    const optionImageMap = {};
    for (let j = 1; j <= 20; j++) {
        const optVal = mediaRow[`Tên phân loại ${j}`];
        const optImg = mediaRow[`Hình ảnh phân loại ${j}`];
        if (optVal) {
            console.log(`Media Option ${j}: "${optVal}" (Img: ${!!optImg})`);
            optionImageMap[optVal.toLowerCase().trim()] = optImg;
        }
    }

    // 4. Compare
    console.log('--- Comparing ---');
    Object.keys(variantMap).forEach(kvVal => {
        const match = optionImageMap[kvVal];
        if (match) {
            console.log(`KV Val "${kvVal}" MATCHES Media Image!`);
        } else {
            console.log(`KV Val "${kvVal}" does NOT match any Media Option.`);
        }
    });
}

debug();
