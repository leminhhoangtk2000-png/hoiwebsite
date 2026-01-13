-- This script fixes the error "Could not find the 'discount_amount' column of 'orders'".
-- It adds the missing 'discount_amount' column to the 'orders' table to store coupon discounts.

ALTER TABLE public.orders
ADD COLUMN discount_amount NUMERIC(10, 2) DEFAULT 0;

COMMENT ON COLUMN public.orders.discount_amount IS 'The total discount amount applied to the order, usually from a coupon.';
