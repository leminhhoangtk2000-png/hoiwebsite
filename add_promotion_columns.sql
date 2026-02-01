-- Add promotion columns to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS promotion_percent NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS sale_price_usd NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS sale_price_vnd NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS promotion_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS promotion_end_date TIMESTAMP WITH TIME ZONE;

-- Comment on columns
COMMENT ON COLUMN products.promotion_percent IS 'Percentage discount (0-100)';
COMMENT ON COLUMN products.sale_price_usd IS 'Price after promotion in USD';
COMMENT ON COLUMN products.sale_price_vnd IS 'Price after promotion in VND';
