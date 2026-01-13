-- This script updates the database schema to support enhanced product features.
-- It is designed to be largely non-destructive, but backing up data is recommended.

-- Step 1: Alter the existing 'products' table
ALTER TABLE public.products
  -- Rename original price to price_usd, assuming it's in USD.
  RENAME COLUMN price TO price_usd;

ALTER TABLE public.products
  -- Add a new column for VND price.
  ADD COLUMN price_vnd NUMERIC(12, 0) NOT NULL DEFAULT 0,
  
  -- Add columns for sales/discounts.
  ADD COLUMN discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')),
  ADD COLUMN discount_value NUMERIC(10, 2) DEFAULT 0,
  
  -- Add a foreign key to the categories table.
  -- Note: We will need a separate script to populate this from the old 'category' text field.
  ADD COLUMN category_id UUID REFERENCES public.categories(id);

-- Note: The old 'variants' and 'category' columns are kept for now to allow for data migration.
-- They can be dropped later with:
-- ALTER TABLE public.products DROP COLUMN variants;
-- ALTER TABLE public.products DROP COLUMN category;

-- Step 2: Create a table for storing multiple product images
CREATE TABLE public.product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Add index for faster lookups
CREATE INDEX ON public.product_images(product_id);


-- Step 3: Create a table for product variant types (e.g., "Color", "Size")
CREATE TABLE public.product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(product_id, name) -- A product can't have two "Color" variants
);
-- Add index for faster lookups
CREATE INDEX ON public.product_variants(product_id);


-- Step 4: Create a table for the options within each variant type (e.g., "Red", "Large")
CREATE TABLE public.product_variant_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
    value TEXT NOT NULL,
    -- Optional price adjustment for this specific option
    additional_price_usd NUMERIC(10, 2) DEFAULT 0,
    additional_price_vnd NUMERIC(12, 0) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(variant_id, value) -- A variant can't have two "Large" options
);
-- Add index for faster lookups
CREATE INDEX ON public.product_variant_options(variant_id);


-- Step 5: Enable Row Level Security (RLS) on the new tables if it's enabled on products.
-- This is a good practice for Supabase projects.
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variant_options ENABLE ROW LEVEL SECURITY;

-- Step 6: Create policies for public access (read-only) on the new tables.
-- This allows anyone to view the images and variants.
CREATE POLICY "Allow public read access to product images"
  ON public.product_images
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access to product variants"
  ON public.product_variants
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access to product variant options"
  ON public.product_variant_options
  FOR SELECT USING (true);

-- Step 7: Create policies for admin access (full control).
-- This assumes you have a way to identify admins, e.g., via a custom function `is_admin()`.
-- You might need to adjust the check `auth.uid() IN (SELECT user_id FROM admins)`.
-- As a placeholder, we can restrict it to a specific role like 'service_role' or 'authenticated' if needed.
-- For now, let's assume admins are authenticated users. A more robust check should be implemented.

CREATE POLICY "Allow full access for authenticated users on product_images"
  ON public.product_images
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow full access for authenticated users on product_variants"
  ON public.product_variants
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow full access for authenticated users on product_variant_options"
  ON public.product_variant_options
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- After running this script, you should run a separate script to migrate
-- data from the old 'products.category' and 'products.variants' columns
-- into the new 'products.category_id' and the new variants tables.
-- You can also choose to drop the old columns after migration.

-- Example of dropping columns after data migration:
-- ALTER TABLE public.products DROP COLUMN category;
-- ALTER TABLE public.products DROP COLUMN variants;

COMMENT ON COLUMN public.products.price_vnd IS 'Price of the product in Vietnamese Dong';
COMMENT ON COLUMN public.products.discount_type IS 'Type of discount: ''percentage'' or ''fixed''';
COMMENT ON COLUMN public.products.discount_value IS 'Value of the discount, either a percentage or a fixed amount';
COMMENT ON TABLE public.product_images IS 'Stores multiple images for each product.';
COMMENT ON TABLE public.product_variants IS 'Defines variant types for a product, like "Color" or "Size".';
COMMENT ON TABLE public.product_variant_options IS 'Stores the specific options for each variant, like "Red" or "Large".';
