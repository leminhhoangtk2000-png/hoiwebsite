
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; // Using anon key might not be enough for schema inspection, usually need service role or just try select
// Actually, I can just try to SELECT sort_order FROM social_channels LIMIT 1 and see if it errors.

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data, error } = await supabase.from('social_channels').select('sort_order').limit(1);
    if (error) {
        console.log('Error listing sort_order:', error.message);
    } else {
        console.log('Column sort_order exists.');
    }
}

check();
