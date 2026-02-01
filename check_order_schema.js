require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkSchema() {
    console.log('Checking order_items schema...');

    // Attempt to insert a dummy row to trigger a column error? No, safer to select.
    // If table is empty, we won't see keys.
    // But we can try to selecting.

    // First, list tables? No, just try to select from order_items
    const { data, error } = await supabase
        .from('order_items')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error selecting:', error);
    } else {
        if (data.length > 0) {
            console.log('Columns found:', Object.keys(data[0]));
        } else {
            console.log('Table is empty. Cannot infer columns from data.');
            // Try inserting a dummy column to see if it allows
        }
    }
}

checkSchema();
