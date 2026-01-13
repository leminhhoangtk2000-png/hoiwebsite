-- This script fixes the error "Could not find the 'image_url' column of 'order_items'".
-- It adds the missing 'image_url' column to the 'order_items' table to store a reference to the product image for that order line.

ALTER TABLE public.order_items
ADD COLUMN image_url TEXT;

COMMENT ON COLUMN public.order_items.image_url IS 'The URL of the product image at the time of purchase.';
