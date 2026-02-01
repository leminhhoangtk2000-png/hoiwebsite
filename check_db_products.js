require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
    const { data: products, error } = await supabase.from('products').select('id, name').limit(5);
    if (error) console.error(error);
    else console.log('Products:', JSON.stringify(products, null, 2));
}

check();
