
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupUnusedCategories() {
    console.log('Starting cleanup of unused categories...');

    // 1. Get all used category IDs from products
    const { data: products, error: productError } = await supabase
        .from('products')
        .select('category_id');

    if (productError) {
        console.error('Error fetching products:', productError);
        return;
    }

    // Get unique used IDs
    const usedCategoryIds = new Set(products.map(p => p.category_id).filter(id => id));
    console.log(`Found ${products.length} products using ${usedCategoryIds.size} unique categories.`);

    // 2. Get all categories
    const { data: categories, error: catError } = await supabase
        .from('categories')
        .select('id, name, parent_id');

    if (catError) {
        console.error('Error fetching categories:', catError);
        return;
    }

    console.log(`Total categories in DB: ${categories.length}`);

    // 3. Identification Logic (Keep Used + Ancestors)
    // We need to trace up from used categories to ensure parents are kept.
    const idsToKeep = new Set(usedCategoryIds);
    const categoryMap = new Map(categories.map(c => [c.id, c]));

    // Iteratively add parents of IDs in idsToKeep
    let sizeBefore = 0;
    do {
        sizeBefore = idsToKeep.size;
        for (const id of idsToKeep) {
            const cat = categoryMap.get(id);
            if (cat && cat.parent_id) {
                idsToKeep.add(cat.parent_id);
            }
        }
    } while (idsToKeep.size > sizeBefore);

    console.log(`Identified ${idsToKeep.size} categories to keep (Used + Ancestors).`);

    // 4. Identify Categories to Delete
    const categoriesToDelete = categories.filter(c => !idsToKeep.has(c.id));

    if (categoriesToDelete.length === 0) {
        console.log('No unused categories found. Cleanup complete.');
        return;
    }

    console.log(`Found ${categoriesToDelete.length} unused categories to delete.`);
    // Log names for verification
    // console.log('Deleting:', categoriesToDelete.map(c => c.name).join(', '));

    // 5. Delete them
    // We delete in batches or one by one. Since foreign keys from products are safe (we rely on them being unused),
    // but check for other FKs? (e.g. child categories).
    // Wait, if a category is "unused" (not in idsToKeep), it implies it has NO used children either (otherwise it would be an ancestor).
    // So it's safe to delete. 
    // However, we might have chains of unused categories (Unused Parent -> Unused Child).
    // Deleting parent first might fail if child exists (FK).
    // Deleting child first is safer. Or just delete all valid non-kept IDs.
    // Postgres usually handles this if we order correctly or just try to delete. 
    // Ideally delete "leaves" first.

    // Simple approach: Extract IDs and delete.
    const deleteIds = categoriesToDelete.map(c => c.id);

    const { error: deleteError } = await supabase
        .from('categories')
        .delete()
        .in('id', deleteIds);

    if (deleteError) {
        console.error('Error deleting categories:', deleteError);
    } else {
        console.log(`Successfully deleted ${categoriesToDelete.length} categories.`);
    }

}

cleanupUnusedCategories();
