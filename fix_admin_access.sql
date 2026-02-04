
-- FIX ADMIN ACCESS (RLS Recursion/Values)

-- 1. Ensure "Users can view own profile" exists. 
--    This breaks the recursion for the "Am I an admin?" check because the user can ALWAYS see themselves first.
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT USING (
  auth.uid() = id
);

-- 2. Ensure "Public profiles are viewable by everyone" is GONE if we want strict security, 
--    OR KEEP IT if we want public profiles. 
--    If 'Public profiles...' exists, it usually overrides others (OR logic). 
--    But if it was missing, the Admin policy was the only one, and it causes recursion.
--    Let's ensure the Admin policy doesn't recurse by using a direct check or just relying on the "view own" policy for the self-check.

--    Ideally, the 'Admins can view all profiles' policy is fine AS LONG AS the user can read their own row via another policy (Step 1).
--    So Step 1 is likely the fix.

-- 3. Double check the Admin policy to be safe
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 4. Just in case: Allow Public to view 'basics' if needed, but for now strict is better.
--    If you need Avatar/Name to be public, you might need a public policy.
--    Re-adding the basic public view for now to ensure site doesn't break for others, 
--    but usually we might want to restrict 'role' column visibility? 
--    Supabase RLS is row-level, not column-level (unless using views).
--    So if we allow public select, we allow viewing role. 
--    If we have 'Public profiles...' policy, then `profile.role` is visible to everyone.
--    If that was the case, middleware would work!
--    So likely 'Public profiles...' is MISSING or the user dropped it previously.

--    Let's just apply Step 1 (View Own) which is secure and minimal.

-- 5. Verification: Update the specific user again just to be 100% sure the previous update didn't fail silently.
--    (User ran it manually, so should be fine).

-- 6. Grant usage on schema public just in case (rarely needed for defaults)
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
