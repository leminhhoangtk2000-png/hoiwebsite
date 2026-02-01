-- Fix missing columns for Shopee Import
-- Run this in your Supabase SQL Editor

-- 1. Ensure 'category' column exists (Text type for "Uniqlo" etc)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'category') THEN
        ALTER TABLE products ADD COLUMN category TEXT DEFAULT 'Uniqlo';
    END IF;
END $$;

-- 2. Ensure 'price' column exists (if it was renamed to price_usd, we might need 'price' back for this import, or alias it)
-- The import script sends 'price'. 
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'price') THEN
        ALTER TABLE products ADD COLUMN price NUMERIC(12,0);
    END IF;
END $$;
