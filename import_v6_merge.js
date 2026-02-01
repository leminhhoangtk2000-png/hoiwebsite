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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- HELPER FUNCTIONS ---
function readExcel(filename, headerRow = 2) {
    const filePath = path.join(__dirname, filename);
    if (!fs.existsSync(filePath)) {
        console.warn(`File not found: ${filename}`);
        return [];
    }
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

// --- MAIN IMPORT ---
async function importV6() {
    console.log('--- Starting Import V6 (Merge 3 Files + Inventory) ---');

    // 1. Read Files
    console.log('Reading files...');
    const basicData = readExcel(BASIC_FILE, 2);
    const mediaData = readExcel(MEDIA_FILE, 2);
    const salesData = readExcel(SALES_FILE, 2);

    console.log(`Loaded: Basic(${basicData.length}), Media(${mediaData.length}), Sales(${salesData.length})`);

    // 2. Index Data by ID
    const productMap = {}; // ID -> { basic, media, sales: [] }

    // index Basic
    basicData.forEach(row => {
        const id = row['Mã Sản phẩm'];
        if (!id) return;
        if (!productMap[id]) productMap[id] = { sales: [] };
        productMap[id].basic = row;
    });

    // index Media
    mediaData.forEach(row => {
        const id = row['Mã Sản phẩm'];
        if (!id) return;
        if (!productMap[id]) productMap[id] = { sales: [] };
        productMap[id].media = row;
    });

    // index Sales (Multiple rows per product for variants)
    salesData.forEach(row => {
        const id = row['Mã Sản phẩm'];
        if (!id) return;
        if (!productMap[id]) productMap[id] = { sales: [] };
        productMap[id].sales.push(row);
    });

    // 3. Clear DB
    console.log('Clearing old data...');
    // Delete in order to avoid FK constraints
    await supabase.from('product_variant_options').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('product_variants').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('product_images').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log('Data cleared.');

    // 4. Transform & Insert
    console.log('Processing products...');
    let successCount = 0;

    // Process Category Map on the fly to avoid pre-scan
    const categoryCache = {}; // nameVn -> id

    for (const [prodId, data] of Object.entries(productMap)) {
        // Must have Basic info at least
        if (!data.basic) continue;

        const basic = data.basic;
        const media = data.media || {}; // Might be missing?
        const salesRows = data.sales || [];

        const nameVn = basic['Tên Sản phẩm'];
        const desc = basic['Mô tả Sản phẩm'];
        const catVn = media['Ngành hàng'] || 'Uncategorized';

        // Category
        let categoryId = categoryCache[catVn];
        if (!categoryId) {
            const catNameEn = await safeTranslate(catVn);
            const slug = generateSlug(catNameEn);

            // Check existing
            const { data: catData } = await supabase.from('categories').select('id').eq('slug', slug).single();
            if (catData) {
                categoryId = catData.id;
            } else {
                const { data: newCat } = await supabase.from('categories').insert({ name: catNameEn, slug }).select().single();
                if (newCat) categoryId = newCat.id;
            }
            categoryCache[catVn] = categoryId;
        }

        const nameEn = await safeTranslate(nameVn);

        // Determine Price & Total Stock
        let priceVnd = 0;
        let totalStock = 0;

        if (salesRows.length > 0) {
            // Price from first row or main
            priceVnd = parseInt(salesRows[0]['Giá']) || 0;
            // Sum stock
            salesRows.forEach(r => totalStock += (parseInt(r['Số lượng']) || 0));
        }

        const priceUsd = parseFloat((priceVnd / EXCHANGE_RATE).toFixed(2));
        const mainImage = media['Ảnh bìa'];

        // Insert Product
        const { data: prodData, error: prodError } = await supabase
            .from('products')
            .insert({
                name: nameEn || nameVn,
                description: desc || '',
                price_vnd: priceVnd,
                price_usd: priceUsd,
                category_id: categoryId,
                main_image_url: mainImage,
                stock: totalStock // Save total stock to product
            })
            .select()
            .single();

        if (prodError || !prodData) {
            console.error(`Failed to insert product ${prodId}:`, prodError?.message);
            continue;
        }
        const newProdId = prodData.id;

        // --- Gallery Images ---
        if (media) {
            const galleryImages = [];
            for (let k = 1; k <= 8; k++) {
                const url = media[`Hình ảnh sản phẩm ${k}`];
                if (url && url !== mainImage) galleryImages.push(url);
            }
            if (galleryImages.length === 0 && mainImage) galleryImages.push(mainImage);

            const limit = galleryImages.slice(0, 5);
            if (limit.length > 0) {
                await supabase.from('product_images').insert(
                    limit.map((url, i) => ({
                        product_id: newProdId,
                        image_url: url,
                        display_order: i
                    }))
                );
            }
        }

        // --- Variants ---
        // Check if we have actual variants (rows with 'Mã Phân loại' or diff 'Tên phân loại')
        // Some simple products have 1 row in Sales with empty Tên phân loại or "Bắt buộc"?

        const validVariants = salesRows.filter(r => r['Tên phân loại']);

        if (validVariants.length > 0) {
            // Create a general variant dimension "Option" or try to find name?
            // Shopee usually puts structure in row 0, but here we just have values.
            // Assumption: Single Dimension "Classification" (Phân loại)

            // Check if values look like "Color: Red, Size: M" ??
            // Using "Model" or "Type" as generic name.
            const variantName = "Variation"; // Or "Options"

            const { data: vType } = await supabase
                .from('product_variants')
                .insert({ product_id: newProdId, name: variantName })
                .select()
                .single();

            if (vType) {
                for (const row of validVariants) {
                    const val = row['Tên phân loại'];
                    const vStock = parseInt(row['Số lượng']) || 0;
                    // Try to finding corresponding image in Media?
                    // Media file has `Tên phân loại X` and `Hình ảnh phân loại X` columns (1..20)
                    // We need to match `val` to Media columns to get image.

                    let imgUrl = null;
                    if (media) {
                        for (let j = 1; j <= 20; j++) {
                            const mediaVal = media[`Tên phân loại ${j}`];
                            if (mediaVal && mediaVal.toLowerCase() === val.toLowerCase()) {
                                imgUrl = media[`Hình ảnh phân loại ${j}`];
                                break;
                            }
                        }
                    }

                    await supabase.from('product_variant_options').insert({
                        variant_id: vType.id,
                        value: val,
                        image_url: imgUrl,
                        stock: vStock
                    });
                }
            }
        } else {
            // Simple product, stock is already in 'products' table.
        }

        successCount++;
        if (successCount % 10 === 0) console.log(`Imported ${successCount}...`);
    }

    console.log(`--- Import V6 Complete. Success: ${successCount} ---`);
}

importV6();
