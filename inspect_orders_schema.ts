
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
    console.log('Checking for existing tables...');

    const { data: tables, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .in('table_name', ['orders', 'order_items'])
        .eq('table_schema', 'public');

    if (error) {
        console.log('Could not query information_schema directly (RLS likely). Trying direct SELECT...');

        // Check Orders
        const { data: orderData, error: orderError } = await supabase.from('orders').select('*').limit(1);
        if (orderError && orderError.code === '42P01') {
            console.log('Table "orders" does NOT exist.');
        } else if (orderError) {
            console.log('Table "orders" exists but select failed:', orderError.message);
        } else {
            console.log('Table "orders" EXISTS.');
            if (orderData && orderData.length > 0) {
                console.log('Sample "orders" columns:', Object.keys(orderData[0]).join(', '));
            } else {
                console.log('Table "orders" exists but is empty. Cannot infer columns.');
            }
        }

        // Check Order Items
        const { data: itemData, error: itemError } = await supabase.from('order_items').select('*').limit(1);
        if (itemError && itemError.code === '42P01') {
            console.log('Table "order_items" does NOT exist.');
        } else if (itemError) {
            console.log('Table "order_items" exists but select failed:', itemError.message);
        } else {
            console.log('Table "order_items" EXISTS.');
            if (itemData && itemData.length > 0) {
                console.log('Sample "order_items" columns:', Object.keys(itemData[0]).join(', '));
            } else {
                console.log('Table "order_items" exists but is empty. Cannot infer columns.');
            }
        }

        return;
    }

    if (tables && tables.length > 0) {
        console.log('Found tables:', tables.map(t => t.table_name).join(', '));
        // If they exist, try to get columns? 
        // Usually easier to just report existence here given anon key limitations.
    } else {
        console.log('Neither "orders" nor "order_items" tables found in public schema.');
    }
}

checkTables();
