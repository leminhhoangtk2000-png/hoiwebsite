
-- FIX INFINITE RECURSION (Error 42P17)
-- Problem: The policy "Admins can view all" Queries 'profiles' table -> Which triggers the policy again -> Loop.
-- Solution: Use a SECURITY DEFINER function to check the role. This bypasses RLS for the check itself.

-- 1. Create a secure function to check admin status
--    SECURITY DEFINER means this function runs with the privileges of the creator (postgres),
--    effectively bypassing RLS on 'public.profiles' during its execution.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
$$;

-- 2. Reset Policies on public.profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- 3. Re-create Policies using the function (No Recursion!)

-- A. View Own Profile
CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT USING (
  auth.uid() = id
);

-- B. Update Own Profile
CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE USING (
  auth.uid() = id
);

-- C. Admin Access (View All) - USES FUNCTION
CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT USING (
  public.is_admin()
);

-- D. Admin Access (Update All) - USES FUNCTION
CREATE POLICY "Admins can update all profiles" ON public.profiles
FOR UPDATE USING (
  public.is_admin()
);

-- 4. Apply similar logic to other tables if needed (Orders, etc.)
--    The previous policies on Orders/Customers usually query 'profiles', which is OK 
--    IF 'profiles' lookup doesn't recurse. 
--    Since we used subqueries there: "EXISTS (SELECT 1 FROM profiles ...)"
--    That subquery on profiles will now trigger profiles RLS.
--    Profiles RLS now uses `is_admin()`, which is safe.
--    So the other tables should be fine automatically! 
--    But for best performance/safety, we can update them to use the function too.

-- Update Orders Policy for safety
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
CREATE POLICY "Admins can view all orders" ON orders FOR SELECT
USING ( public.is_admin() );

DROP POLICY IF EXISTS "Admins can update orders" ON orders;
CREATE POLICY "Admins can update orders" ON orders FOR UPDATE
USING ( public.is_admin() );

-- Update Customers Policy
DROP POLICY IF EXISTS "Admins can view all customers" ON customers;
CREATE POLICY "Admins can view all customers" ON customers FOR SELECT
USING ( public.is_admin() );

DROP POLICY IF EXISTS "Admins can update all customers" ON customers;
CREATE POLICY "Admins can update all customers" ON customers FOR UPDATE
USING ( public.is_admin() );
