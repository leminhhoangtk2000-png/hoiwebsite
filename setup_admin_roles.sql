
-- 1. Ensure 'role' column exists in profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';

-- 2. Update existing users to 'user' by default (safety)
--    Only set those that are null or not set.
UPDATE public.profiles SET role = 'user' WHERE role IS NULL;

-- 3. Manually set specific email to 'admin' (User requested this)
--    Replace 'YOUR_EMAIL@EXAMPLE.COM' with the actual email or handle this via UI initially.
--    Since I don't know the exact email, I will rely on the user running a specific UPDATE command or
--    the previous script which set everyone to admin (for dev convenience).
--    Reverting the "all admins" policy from previous step might be safer for "Strict" requirements.
--    But for now, let's keep the user's specific request logic:
--    "provide the SQL to update existing users to 'user' role and manually set my account to 'admin'."

--    Let's RESET everyone to 'user' first.
UPDATE public.profiles SET role = 'user';

--    Then the user needs to run:
--    UPDATE public.profiles SET role = 'admin' WHERE email = 'my@email.com';
--    (I will add a comment instructng them)

-- 4. RLS POLICIES FOR RBAC

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Admin can VIEW ALL profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Policy: Admin can UPDATE ALL profiles (Optional, usually good for management)
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" ON public.profiles
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Policy: Users can VIEW OWN profile (Already exists usually)
-- Policy: Users can UPDATE OWN profile (Already exists usually)

-- 5. RLS FOR OTHER TABLES (Enforce Admin Access)

-- Orders: Admins can view/update all
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
CREATE POLICY "Admins can view all orders" ON orders FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Admins can update orders" ON orders;
CREATE POLICY "Admins can update orders" ON orders FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Order Items: Admins can view all
DROP POLICY IF EXISTS "Admins can view all order items" ON order_items;
CREATE POLICY "Admins can view all order items" ON order_items FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Customers: Admins can view/update all
DROP POLICY IF EXISTS "Admins can view all customers" ON customers;
CREATE POLICY "Admins can view all customers" ON customers FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Admins can update all customers" ON customers;
CREATE POLICY "Admins can update all customers" ON customers FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
