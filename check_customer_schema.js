require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkCustomerSchema() {
    console.log('Checking customers schema...');

    // Select 1 row to see keys
    const { data, error } = await supabase
        .from('customers')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error selecting:', error);
    } else {
        if (data.length > 0) {
            console.log('Columns found:', Object.keys(data[0]));
        } else {
            console.log('Table is empty. Cannot infer columns from data. Assuming basic columns exist based on checkout code.');
            // Current checkout code uses: full_name, phone, email, address
        }
    }
}

checkCustomerSchema();
