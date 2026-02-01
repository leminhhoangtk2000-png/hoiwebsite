require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkImages() {
    console.log('--- Checking Image Data ---');

    // 1. Check Product Main Images
    const { data: products, error: pError } = await supabase
        .from('products')
        .select('id, name, main_image_url')
        .not('main_image_url', 'is', null)
        .limit(5);

    if (pError) console.error('Product Error:', pError);
    else {
        console.log(`\nProducts with Main Image (Sample 5):`);
        products.forEach(p => console.log(`- ${p.name}: ${p.main_image_url}`));
        if (products.length === 0) console.log('No products have main_image_url set.');
    }

    // 2. Check Product Images Table
    const { count, error: piError } = await supabase
        .from('product_images')
        .select('*', { count: 'exact', head: true });

    if (piError) console.error('Product Images Table Error:', piError);
    else console.log(`\nTotal rows in product_images table: ${count}`);

    // 3. Check Variant Images
    const { data: variants, error: vError } = await supabase
        .from('product_variant_options')
        .select('value, image_url')
        .not('image_url', 'is', null)
        .limit(5);

    if (vError) console.error('Variant Error:', vError);
    else {
        console.log(`\nVariants with Image URL (Sample 5):`);
        variants.forEach(v => console.log(`- ${v.value}: ${v.image_url}`));
        if (variants.length === 0) console.log('No variants have image_url set.');
    }
}

checkImages();
