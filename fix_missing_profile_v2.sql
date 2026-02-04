
-- FIX MISSING PROFILES AND SET ADMIN

-- 1. Insert missing profiles for ANY user that exists in auth.users but not in public.profiles
--    This "heals" the data integrity issue.
INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
SELECT 
    id, 
    email, 
    raw_user_meta_data->>'full_name', 
    raw_user_meta_data->>'avatar_url',
    'customer' -- Default role
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);

-- 2. NOW update the specific user to 'admin'
--    Since we just inserted the row (if it was missing), this UPDATE will now definitely work.
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'leminhhoangtk2000@gmail.com';  -- hardcoded based on user request context

-- 3. Verify the result (optional select for the user to see in SQL Editor)
SELECT * FROM public.profiles WHERE email = 'leminhhoangtk2000@gmail.com';
