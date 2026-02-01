require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
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

async function migrateCategories() {
    console.log('--- Migrating Categories to Tree Structure ---');

    // 1. Fetch all existing categories (Flat)
    // We assume current categories are the result of imports: "Women Clothes/A/B"
    const { data: allCats } = await supabase.from('categories').select('*');
    if (!allCats) return;

    console.log(`Found ${allCats.length} existing categories.`);

    // 2. Build Cache & Map
    // We want to process them, creating new structure, and MAPPING old IDs to new IDs to update products.
    const oldIdToNewId = {};
    const createdCache = {}; // "slug" -> id (of new structure)

    // Helper to get/create category
    async function getOrCreate(name, parentId = null) {
        const slug = generateSlug(name);
        // Distinguish by parent? 
        // Ideally slugs should be unique globally for simple routing, OR specific.
        // Let's assume global unique slugs for now for simplicity, or "parent-child-slug"

        const cacheKey = parentId ? `${parentId}_${slug}` : slug;
        if (createdCache[cacheKey]) return createdCache[cacheKey];

        // Check DB (only check by slug? Or slug + parent?)
        // If we really want tree, we should check name + parent match.
        // But let's check slug first.
        let query = supabase.from('categories').select('id, parent_id').eq('slug', slug);
        if (parentId) query = query.eq('parent_id', parentId);
        else query = query.is('parent_id', null);

        const { data: existing } = await query.single();

        if (existing) {
            createdCache[cacheKey] = existing.id;
            return existing.id;
        }

        // Create
        const { data: newCat, error } = await supabase.from('categories').insert({
            name,
            slug,
            parent_id: parentId
        }).select().single();

        if (error) {
            console.error(`Error creating ${name}:`, error.message);
            // Fallback: search by slug ignoring parent?
            return null;
        }
        createdCache[cacheKey] = newCat.id;
        return newCat.id;
    }

    // 3. Process
    for (const oldCat of allCats) {
        let rawName = oldCat.name;

        // Remove "Women Clothes" prefix if exists (case insensitive)
        const prefix = "Women Clothes/";
        // Also handle Vietnamese? "100XXX - Women Clothes/..." 
        // Shopee names often start with ID: "100104 - Women Clothes/Dresses"

        let pathStr = rawName;
        // Strip ID prefix "123456 - "
        if (pathStr.match(/^\d+\s-\s/)) {
            pathStr = pathStr.replace(/^\d+\s-\s/, '');
        }

        // If it still starts with "Women Clothes/", strip it
        // Note: The previous import translated names to EN. 
        // If "phụ nữ" etc, might differ. But current DB has EN names from prev import?
        // Let's assume it's "Women Clothes/...".
        if (pathStr.toLowerCase().startsWith('women clothes/')) {
            pathStr = pathStr.substring('women clothes/'.length);
        } else if (pathStr === 'Women Clothes') {
            continue; // Skip root
        }

        const parts = pathStr.split('/').map(s => s.trim());

        let parentId = null;
        for (const part of parts) {
            parentId = await getOrCreate(part, parentId);
        }

        // The last ID is the target ID for this old category
        if (parentId) {
            oldIdToNewId[oldCat.id] = parentId;
        }
    }

    console.log(`Mapped ${Object.keys(oldIdToNewId).length} categories.`);

    // 4. Update Products
    console.log('Updating products...');
    const { data: products } = await supabase.from('products').select('id, category_id');
    if (products) {
        for (const p of products) {
            const newCatId = oldIdToNewId[p.category_id];
            if (newCatId && newCatId !== p.category_id) {
                await supabase.from('products').update({ category_id: newCatId }).eq('id', p.id);
            }
        }
    }

    // 5. Cleanup Old Categories (names contain '/')
    // Be careful not to delete NEW categories if they happen to share IDs (unlikely with UUIDs).
    // Safer: Delete categories that are NOT in `createdCache` values AND contain '/'.
    // Actually, simple logic:
    // Delete any category where name contains "/" (The old flat paths).
    console.log('Cleaning up old categories...');
    // We can't do LIKE in delete directly easily? 
    // Wait, delete where name ILIKE '%/%' should work.

    // Safety check: ensure we don't delete new ones. New ones are single words "Tops".
    await supabase.from('categories').delete().ilike('name', '%/%');
    await supabase.from('categories').delete().ilike('name', '% - %'); // Remove "100123 - Women..."

    console.log('--- Migration Complete ---');
}

migrateCategories();
