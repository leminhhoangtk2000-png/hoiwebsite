-- Rename customer_id to user_id in orders table
ALTER TABLE public.orders 
RENAME COLUMN customer_id TO user_id;

-- Optional: Ensure it references auth.users if it doesn't already
-- This part acts as a "fixing" step. If the constraint already exists, it might error, so we wrap it.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'orders_user_id_fkey'
    ) THEN
        -- Drop old constraint if it has a weird name (optional, tricky without knowing the name)
        -- For now, let's just add the foreign key constraint ensuring it links to auth.users
        -- We assume the column type is already UUID
        
        ALTER TABLE public.orders 
        ADD CONSTRAINT orders_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id);
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Constraint creation skipped or failed: %', SQLERRM;
END $$;
