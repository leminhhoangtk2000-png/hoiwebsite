require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Error: Missing credentials.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkDatabase() {
    console.log('--- Checking Database Status ---');
    console.log(`URL: ${SUPABASE_URL}`);

    // 1. Check Products
    const { count: productCount, error: productError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

    if (productError) {
        console.error('Error checking products:', productError.message);
    } else {
        console.log(`Total Products: ${productCount}`);
    }

    const { data: sampleProducts, error: sampleError } = await supabase
        .from('products')
        .select('name, price_vnd, price_usd, category, main_image_url')
        .order('created_at', { ascending: false })
        .limit(5);

    if (sampleError) {
        console.error('Error fetching sample:', sampleError.message);
    } else {
        console.log('\n--- Sample Products ---');
        sampleProducts.forEach(p => {
            console.log(`- [${p.category}] ${p.name} \n  Price: ${p.price_vnd?.toLocaleString()} VND / $${p.price_usd}`);
        });
    }

    // 3. Check Categories (if table exists)
    const { count: catCount, error: catError } = await supabase
        .from('categories')
        .select('*', { count: 'exact', head: true });

    if (!catError) {
        console.log(`\nTotal Maximum Categories: ${catCount}`);
    }

    console.log('\n--- check_db.js finished ---');
}

checkDatabase();
