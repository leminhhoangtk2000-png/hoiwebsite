require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function cleanupCategories() {
    console.log('--- Cleaning Categories Starting with Numbers ---');

    // Fetch all
    const { data: cats } = await supabase.from('categories').select('id, name');

    const toDelete = cats.filter(c => /^\d/.test(c.name));

    console.log(`Found ${toDelete.length} categories to delete:`);
    toDelete.forEach(c => console.log(`- ${c.name}`));

    if (toDelete.length > 0) {
        const ids = toDelete.map(c => c.id);
        const { error } = await supabase.from('categories').delete().in('id', ids);
        if (error) console.error('Error deleting:', error.message);
        else console.log('Deletion Successful.');
    } else {
        console.log('No matching categories found.');
    }
}

cleanupCategories();
