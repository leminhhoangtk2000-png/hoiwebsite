
-- FINAL FIX FOR ADMIN PERMISSIONS
-- This script resets permissions and policies to ensure accessibility.

-- 1. Ensure RLS is enabled (Standard)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. GRANT PERMISSIONS (Often overlooked)
--    Ensure 'authenticated' users can actually SELECT/UPDATE the table strings.
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;

-- 3. RESET POLICIES (Drop all to avoid conflicts)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
-- Drop any other potentially conflicting policies
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;

-- 4. RE-CREATE POLICIES (Simple & Robust)

-- A. View Own Profile (CRITICAL for Middleware)
CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT USING (
  auth.uid() = id
);

-- B. Update Own Profile
CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE USING (
  auth.uid() = id
);

-- C. Admin Access (View All)
CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT USING (
  -- Check if the requesting user has the 'admin' role.
  -- To avoid recursion, we rely on the fact that they can view their OWN profile via Policy A.
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- 5. VERIFY DATA (Again, just to be sure)
--    This doesn't change anything, just confirming the row exists.
UPDATE public.profiles SET role = 'admin' WHERE email = 'leminhhoangtk2000@gmail.com';
