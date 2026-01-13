-- STEP 1: Update social_channels to support image icons
ALTER TABLE social_channels
ADD COLUMN icon_url TEXT,
ALTER COLUMN icon_code DROP NOT NULL;

COMMENT ON COLUMN social_channels.icon_url IS 'URL to the social media icon image from storage.';
COMMENT ON COLUMN social_channels.icon_code IS 'Legacy text-based icon code, now optional.';


-- STEP 2: Logic update for site_settings (handled in code)
-- No schema change is needed if the 'value' column is of type TEXT or JSON/JSONB.
-- We will stop using the 'hero_banner' key and start using 'hero_banners' (JSON array of strings).
-- It's recommended to manually remove the old 'hero_banner' row after migration.
-- DELETE FROM site_settings WHERE key = 'hero_banner';


-- STEP 3: Create the new home_sections table for dynamic homepage content
CREATE TABLE home_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    category_slug TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE home_sections IS 'Stores dynamic sections to be displayed on the homepage.';
COMMENT ON COLUMN home_sections.title IS 'The display title for the section, e.g., "New Arrivals".';
COMMENT ON COLUMN home_sections.category_slug IS 'The category slug to fetch products for this section.';
COMMENT ON COLUMN home_sections.display_order IS 'The order in which sections are displayed on the homepage.';
COMMENT ON COLUMN home_sections.is_active IS 'Whether the section is currently visible on the homepage.';


-- STEP 4: Insert dummy data for home_sections
-- These slugs 'men' and 'women' are examples.
-- Use the actual slugs from your 'categories' table.
INSERT INTO home_sections (title, category_slug, display_order, is_active)
VALUES
    ('New for Men', 'men', 1, true),
    ('Women''s Collection', 'women', 2, true),
    ('Best Sellers', 'all', 3, true);

-- Enable Row-Level Security (RLS) for the new table if you have it enabled for others.
ALTER TABLE home_sections ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public read access for active sections
-- and allow all access for service_role (e.g., for admin operations).
CREATE POLICY "Allow public read access to active home sections"
ON home_sections
FOR SELECT
TO anon, authenticated
USING (is_active = true);

CREATE POLICY "Allow all access for service_role"
ON home_sections
FOR ALL
TO service_role
USING (true);

-- Grant usage for the new table
GRANT ALL ON TABLE home_sections TO postgres;
GRANT ALL ON TABLE home_sections TO service_role;
GRANT SELECT ON TABLE home_sections TO anon;
GRANT SELECT ON TABLE home_sections TO authenticated;

-- Add some dummy hero banners as well
-- Make sure to remove the old 'hero_banner' entry
DELETE FROM site_settings WHERE key = 'hero_banner';

-- Insert the new 'hero_banners' setting with a JSON array of image URLs
-- Replace these with actual URLs from your storage.
INSERT INTO site_settings (key, value)
VALUES ('hero_banners', '["https://placehold.co/1200x600/E2E8F0/4A5568?text=Banner+1", "https://placehold.co/1200x600/D1D5DB/374151?text=Banner+2", "https://placehold.co/1200x600/9CA3AF/1F2937?text=Banner+3"]')
ON CONFLICT (key) DO UPDATE
SET value = '["https://placehold.co/1200x600/E2E8F0/4A5568?text=Banner+1", "https://placehold.co/1200x600/D1D5DB/374151?text=Banner+2", "https://placehold.co/1200x600/9CA3AF/1F2937?text=Banner+3"]';
