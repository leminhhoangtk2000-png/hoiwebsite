-- Add stock to product_variant_options
ALTER TABLE product_variant_options 
ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0;

-- Add stock to products (for simple products without variants)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0;
