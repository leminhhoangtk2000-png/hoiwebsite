-- Add image_url to product_variant_options
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_variant_options' AND column_name = 'image_url') THEN
        ALTER TABLE product_variant_options ADD COLUMN image_url TEXT;
    END IF;
END $$;
