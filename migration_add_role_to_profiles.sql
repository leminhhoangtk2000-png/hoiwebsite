
-- 1. Add 'role' column to profiles if it doesn't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'customer';

-- 2. Grant 'admin' role to all existing users (for immediate access in this dev phase)
-- In production, you would only grant this to specific users.
UPDATE public.profiles SET role = 'admin' WHERE role = 'customer' OR role IS NULL;

-- 3. Fix RLS for Orders (Admin Access)
-- Allow admins to UPDATE any order
CREATE POLICY "Admins can update orders" ON orders FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Allow admins to VIEW any order
CREATE POLICY "Admins can view all orders" ON orders FOR SELECT
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 4. Fix RLS for Order Items (Admin Access)
-- Allow admins to VIEW any order item
CREATE POLICY "Admins can view all order items" ON order_items FOR SELECT
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 5. Fix RLS for Customers (Admin Access)
-- Allow admins to VIEW/UPDATE any customer data
CREATE POLICY "Admins can view all customers" ON customers FOR SELECT
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update all customers" ON customers FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 6. Ensure Policies are applied (Enable RLS just in case)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
