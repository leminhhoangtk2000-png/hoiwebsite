require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkVariants() {
    console.log('--- Checking Variants Splitting ---');

    // Find a product with multiple variants
    const { data: products } = await supabase
        .from('products')
        .select(`
            id, 
            name, 
            product_variants (
                name,
                product_variant_options ( value, stock, image_url )
            )
        `)
        .limit(5);

    products.forEach(p => {
        if (p.product_variants.length > 0) {
            console.log(`\nProduct: ${p.name}`);
            p.product_variants.forEach(v => {
                console.log(`  - Variant: ${v.name}`);
                v.product_variant_options.forEach(o => {
                    console.log(`    * [${o.stock}] ${o.value} (Image: ${o.image_url ? 'Yes' : 'No'})`);
                });
            });
        }
    });
}

checkVariants();
