
-- THIS SCRIPT FIXES THE SCHEMA AND MIGRATES EXISTING DATA WITHOUT DATA LOSS

-- 1. Drop existing constraints if they exist to avoid conflicts during migration
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_customer_id_fkey;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;

-- 2. Add the 'customer_id' column if it doesn't exist
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id UUID;

-- 3. DATA MIGRATION:
-- The current 'user_id' column actually holds 'customer_id' data from our previous logic.
-- We must move this data to the new 'customer_id' column.
UPDATE orders 
SET customer_id = user_id 
WHERE customer_id IS NULL;

-- 4. CLEANUP:
-- Now that data is safe in 'customer_id', we set 'user_id' to NULL for these rows.
-- This is because these IDs are NOT valid auth.users IDs, they are customer IDs.
-- Setting them to NULL allows us to add the Foreign Key constraint without violation.
UPDATE orders 
SET user_id = NULL 
WHERE user_id IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM auth.users WHERE id = orders.user_id);

-- 5. APPLY CONSTRAINTS:

-- Make user_id nullable (it should be already, but being safe)
ALTER TABLE orders ALTER COLUMN user_id DROP NOT NULL;

-- Add FK for reference to public.customers
ALTER TABLE orders 
  ADD CONSTRAINT orders_customer_id_fkey 
  FOREIGN KEY (customer_id) 
  REFERENCES public.customers(id);

-- Add FK for reference to auth.users
ALTER TABLE orders 
  ADD CONSTRAINT orders_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id);

-- 6. INDEXING (Optional but good for performance)
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
