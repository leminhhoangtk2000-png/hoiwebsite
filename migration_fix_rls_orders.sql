
-- Fix RLS Policies to allow creating orders (for both Guests and Logged-in Users)
-- The previous policies were too strict, requiring auth.uid() match, which fails for Guest checkout.

-- 1. ORDERS TABLE
-- Drop restrictive policy
DROP POLICY IF EXISTS "Users can insert their own orders" ON orders;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON orders; -- In case we named it this

-- Allow anyone (auth and anon) to CREATE an order.
-- We do not allow them to SELECT or UPDATE arbitrary orders, only INSERT.
CREATE POLICY "Enable insert for everyone" ON orders FOR INSERT WITH CHECK (true);

-- Ensure SELECT/UPDATE policies still exist (re-applying just in case, using IDEMPOTENT approach)
-- Note: You might want to allow users to see their own orders.
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
CREATE POLICY "Users can view their own orders" ON orders FOR SELECT USING (auth.uid() = user_id);

-- 2. ORDER_ITEMS TABLE
-- Drop restrictive policy
DROP POLICY IF EXISTS "Users can insert their own order items" ON order_items;

-- Allow anyone to insert items (linked to the order they just created)
CREATE POLICY "Enable insert for everyone" ON order_items FOR INSERT WITH CHECK (true);

-- Ensure SELECT policies exist
DROP POLICY IF EXISTS "Users can view their own order items" ON order_items;
CREATE POLICY "Users can view their own order items" ON order_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_items.order_id 
    AND orders.user_id = auth.uid()
  )
);

-- 3. CUSTOMERS TABLE (Just in case)
-- Guests need to insert customers too
DROP POLICY IF EXISTS "Users can insert their own customers" ON customers;
CREATE POLICY "Enable insert for everyone" ON customers FOR INSERT WITH CHECK (true);
