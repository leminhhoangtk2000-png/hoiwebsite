require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const translate = require('google-translate-api-x');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

function generateSlug(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function safeTranslate(text) {
    if (!text) return '';
    try {
        const res = await translate(text, { to: 'en' });
        return res.text;
    } catch { return text; }
}

async function cleanupAndRemap() {
    console.log('--- Remapping and Cleaning Numbered Categories ---');

    // 1. Get Numbered Cats
    const { data: allCats } = await supabase.from('categories').select('*');
    const numberedCats = allCats.filter(c => /^\d/.test(c.name));

    console.log(`Found ${numberedCats.length} numbered categories to process.`);

    for (const oldCat of numberedCats) {
        // Parse name: "100358 - Women Clothes/Pants & Leggings/Pants"
        // Target: "Pants" (Leaf)
        let name = oldCat.name.replace(/^\d+\s-\s/, ''); // "Women Clothes/..."
        if (name.toLowerCase().startsWith('women clothes/')) {
            name = name.substring('women clothes/'.length);
        }

        // Split "Pants & Leggings/Pants"
        const parts = name.split('/').map(s => s.trim());
        const targetName = parts[parts.length - 1]; // Leaf
        const targetSlug = generateSlug(targetName);

        // Find match in DB (The new cleaned category)
        const { data: targetCat } = await supabase
            .from('categories')
            .select('id')
            .eq('slug', targetSlug)
            .single();

        if (targetCat) {
            console.log(`Mapping "${oldCat.name}" -> "${targetName}" (${targetCat.id})`);

            // Update Products
            const { error: updateError } = await supabase
                .from('products')
                .update({ category_id: targetCat.id })
                .eq('category_id', oldCat.id);

            if (updateError) {
                console.error(`  Failed to update products: ${updateError.message}`);
            } else {
                // Now Delete
                const { error: delError } = await supabase.from('categories').delete().eq('id', oldCat.id);
                if (delError) console.error(`  Failed to delete: ${delError.message}`);
                else console.log(`  Deleted.`);
            }
        } else {
            console.warn(`  No target found for "${targetName}" (Slug: ${targetSlug}). Creating it?`);
            // Create if missing? 
            // Reuse logic? simplified: just create top level or try to find parent?
            // Let's create it as top level for safety if missing.
            const { data: newCat } = await supabase
                .from('categories')
                .insert({ name: targetName, slug: targetSlug })
                .select()
                .single();

            if (newCat) {
                await supabase.from('products').update({ category_id: newCat.id }).eq('category_id', oldCat.id);
                await supabase.from('categories').delete().eq('id', oldCat.id);
                console.log(`  Created "${targetName}" and remapped.`);
            }
        }
    }
    console.log('--- Cleanup Complete ---');
}

cleanupAndRemap();
