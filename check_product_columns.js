const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error selecting:', error);
    } else {
        if (data.length > 0) {
            console.log('Columns found:', Object.keys(data[0]));
            console.log('Sample data:', data[0]);
        } else {
            console.log('Table is empty. Cannot infer columns from data, but query worked.');
            // Insert a dummy to check? No, risky.
        }
    }
}

checkSchema();
