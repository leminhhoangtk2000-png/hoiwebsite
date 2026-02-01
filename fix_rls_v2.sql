-- This is an updated and more robust script to fix Row-Level Security (RLS) issues.
-- It ensures any old, conflicting policies are removed before creating a new, comprehensive one.
-- Please run this entire script in your Supabase SQL Editor.

-- Drop all potentially conflicting policies for the 'logos' bucket first.
-- This allows the script to be re-run safely.
DROP POLICY IF EXISTS "Authenticated can select logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can insert logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can manage logos" ON storage.objects;

-- Create a single policy that gives full control (SELECT, INSERT, UPDATE, DELETE)
-- over the 'logos' bucket to any user that is logged in (authenticated).
CREATE POLICY "Authenticated users can manage logos"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'logos' AND auth.uid() IS NOT NULL)
WITH CHECK (bucket_id = 'logos' AND auth.uid() IS NOT NULL);

-- Informational comments:
-- FOR ALL: Applies the policy to SELECT, INSERT, UPDATE, and DELETE actions.
-- TO authenticated: Specifies that this policy applies to any request made with a valid JWT (i.e., any logged-in user).
-- USING: This clause is checked when a user tries to read, update, or delete existing rows.
-- WITH CHECK: This clause is checked when a user tries to insert a new row or update an existing one.
-- auth.uid() IS NOT NULL: This is an explicit check to ensure the user is properly authenticated.
