require('dotenv').config({ path: '.env.local' });
const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const translate = require('google-translate-api-x');

// --- CONFIGURATION ---
const BASIC_FILE = 'mass_update_basic_info_111608803_20260120023837.xlsx';
const MEDIA_FILE = 'mass_update_media_info_111608803_20260120023826.xlsx';
const SALES_FILE = 'mass_update_sales_info_111608803_20260120023906.xlsx';
const EXCHANGE_RATE = 25400;

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

function readExcel(filename, headerRow = 2) {
    const filePath = path.join(__dirname, filename);
    if (!fs.existsSync(filePath)) return [];
    const workbook = XLSX.readFile(filePath);
    return XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { range: headerRow });
}

async function safeTranslate(text) {
    if (!text) return '';
    if (typeof text !== 'string') return String(text);
    try {
        const res = await translate(text, { to: 'en' });
        return res.text;
    } catch { return text; }
}

function generateSlug(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function importV7() {
    console.log('--- Starting Import V7 (Refined Variants + Stock Filter) ---');

    const basicData = readExcel(BASIC_FILE, 2);
    const mediaData = readExcel(MEDIA_FILE, 2);
    const salesData = readExcel(SALES_FILE, 2); // Headers at row 2

    // Index Data
    const productMap = {}; // ID -> { basic, media, sales: [] }
    basicData.forEach(r => { if (r['Mã Sản phẩm']) productMap[r['Mã Sản phẩm']] = { basic: r, sales: [] } });
    mediaData.forEach(r => { if (r['Mã Sản phẩm'] && productMap[r['Mã Sản phẩm']]) productMap[r['Mã Sản phẩm']].media = r });
    salesData.forEach(r => { if (r['Mã Sản phẩm'] && productMap[r['Mã Sản phẩm']]) productMap[r['Mã Sản phẩm']].sales.push(r) });

    // Clear DB
    console.log('Clearing old data...');
    await supabase.from('product_variant_options').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('product_variants').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('product_images').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    let successCount = 0;
    const categoryCache = {};

    for (const [prodId, data] of Object.entries(productMap)) {
        if (!data.basic) continue;

        // 1. Filter Sales Rows by Stock > 0
        const validSales = data.sales.filter(r => {
            const stock = parseInt(r['Số lượng']) || 0;
            return stock > 0;
        });

        // If product is simple (no variants), check its own stock rows? 
        // Or if it has variants but all are 0 stock -> Skip product?
        // Let's assume validSales.length refers to stocked variants.
        // BUT simple product also appears in Sales (1 row). If stock 0 -> skip.
        if (validSales.length === 0) {
            // console.log(`Skipping Product ${prodId}: Out of Stock`);
            continue;
        }

        const basic = data.basic;
        const media = data.media || {};

        // Category
        const catVn = media['Ngành hàng'] || 'Uncategorized';
        let categoryId = categoryCache[catVn];
        if (!categoryId) {
            const catNameEn = await safeTranslate(catVn);
            const slug = generateSlug(catNameEn);
            const { data: c } = await supabase.from('categories').select('id').eq('slug', slug).single();
            if (c) categoryId = c.id;
            else {
                const { data: n } = await supabase.from('categories').insert({ name: catNameEn, slug }).select().single();
                if (n) categoryId = n.id;
            }
            categoryCache[catVn] = categoryId;
        }

        // Product Details
        const nameVn = basic['Tên Sản phẩm'];
        const nameEn = await safeTranslate(nameVn);
        const priceVnd = parseInt(validSales[0]['Giá']) || 0;
        const totalStock = validSales.reduce((sum, r) => sum + (parseInt(r['Số lượng']) || 0), 0);
        const mainImage = media['Ảnh bìa'];

        const { data: prod, error: err } = await supabase.from('products').insert({
            name: nameEn || nameVn,
            description: basic['Mô tả Sản phẩm'],
            price_vnd: priceVnd,
            price_usd: parseFloat((priceVnd / EXCHANGE_RATE).toFixed(2)),
            category_id: categoryId,
            main_image_url: mainImage,
            stock: totalStock
        }).select().single();

        if (err) continue;
        const newProdId = prod.id;

        // Gallery
        if (media) {
            const imgs = [];
            for (let i = 1; i <= 8; i++) if (media[`Hình ảnh sản phẩm ${i}`]) imgs.push(media[`Hình ảnh sản phẩm ${i}`]);
            // Add main if not present?
            if (imgs.length === 0 && mainImage) imgs.push(mainImage);
            if (imgs.length > 0) {
                await supabase.from('product_images').insert(imgs.slice(0, 5).map((u, i) => ({ product_id: newProdId, image_url: u, display_order: i })));
            }
        }

        // Variants Parsing
        // Group variants by dimensions
        const variantsData = {}; // "Color" -> { "Red": { stock: 10, img: ... } }

        // Determine Dimension Names
        const dim1Name = media['Tên nhóm phân loại hàng 1'] || 'Variation 1';
        // Need to guess Dim 2 name if exists
        let hasDim2 = false;

        validSales.forEach(row => {
            const rawName = row['Tên phân loại']; // "A,B" or "A"
            if (!rawName || rawName === 'Bắt buộc') return; // Simple product?

            const parts = rawName.split(',').map(s => s.trim());
            const stock = parseInt(row['Số lượng']) || 0;

            // Dim 1
            if (parts[0]) {
                const val1 = parts[0];
                if (!variantsData[dim1Name]) variantsData[dim1Name] = {};
                if (!variantsData[dim1Name][val1]) variantsData[dim1Name][val1] = { stock: 0, img: null };

                variantsData[dim1Name][val1].stock += stock;

                // Image Mapping for Dim 1
                // Find in Media columns 1..20
                if (!variantsData[dim1Name][val1].img) { // only needed once
                    for (let j = 1; j <= 20; j++) {
                        if (media[`Tên phân loại ${j}`] === val1) {
                            variantsData[dim1Name][val1].img = media[`Hình ảnh phân loại ${j}`];
                            break;
                        }
                    }
                }
            }

            // Dim 2
            if (parts[1]) {
                hasDim2 = true;
                const dim2Name = 'Variation 2'; // Fallback
                const val2 = parts[1];

                if (!variantsData[dim2Name]) variantsData[dim2Name] = {};
                if (!variantsData[dim2Name][val2]) variantsData[dim2Name][val2] = { stock: 0, img: null };

                variantsData[dim2Name][val2].stock += stock;
                // Dim 2 usually has no image in Shopee model (only Group 1 has images)
            }
        });

        // Insert Variants
        for (const [vName, options] of Object.entries(variantsData)) {
            let finalVName = vName;
            // Heuristics
            if (Object.keys(options).some(k => ['S', 'M', 'L', 'XL'].includes(k))) finalVName = 'Size';
            if (Object.keys(options).some(k => ['đỏ', 'xanh', 'trắng', 'đen'].some(c => k.toLowerCase().includes(c)))) finalVName = 'Color';

            // If vName from header is specific, keep it encoded or translated?
            // "Màu sắc" -> "Color"
            if (finalVName.toLowerCase().includes('màu')) finalVName = 'Color';
            if (finalVName.toLowerCase().includes('size') || finalVName.toLowerCase().includes('kích')) finalVName = 'Size';

            const { data: vRecord } = await supabase.from('product_variants').insert({ product_id: newProdId, name: finalVName }).select().single();

            if (vRecord) {
                for (const [val, info] of Object.entries(options)) {
                    await supabase.from('product_variant_options').insert({
                        variant_id: vRecord.id,
                        value: val,
                        image_url: info.img,
                        stock: info.stock
                    });
                }
            }
        }

        successCount++;
        if (successCount % 10 === 0) console.log(`Imported ${successCount}...`);
    }

    console.log(`--- Import V7 Complete. Success: ${successCount} ---`);
}

importV7();
