-- Fix Row-Level Security (RLS) policies for the "logos" storage bucket.
-- This script grants authenticated users full permissions (select, insert, update, delete)
-- on objects within the "logos" bucket.

-- 1. Enable RLS on the "objects" table in the "storage" schema if not already enabled.
-- Supabase manages files as rows in this table.
-- Note: This might already be on by default.
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies for the "logos" bucket to avoid conflicts.
-- Replace 'authenticated_user_policy_name' with your actual policy names if they exist.
-- It's often cleaner to start fresh. You can find policy names in Supabase UI (Storage -> Policies).
-- Example: DROP POLICY IF EXISTS "Authenticated users can upload logos" ON storage.objects;
-- For simplicity, we will assume no conflicting policies and create new ones.

-- 3. Create a policy that allows authenticated users to VIEW (select) logos.
-- This is useful for displaying the current logo in the admin panel.
CREATE POLICY "Authenticated can select logos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'logos');

-- 4. Create a policy that allows authenticated users to UPLOAD (insert) new logos.
-- This is the main policy that will fix the "violates row-level security" error on upload.
CREATE POLICY "Authenticated can insert logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'logos');

-- 5. Create a policy that allows authenticated users to UPDATE logos.
-- Useful if you need to replace or rename files, which Supabase handles as updates.
CREATE POLICY "Authenticated can update logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'logos');

-- 6. Create a policy that allows authenticated users to DELETE logos.
-- This is required for the functionality that removes the old logo when a new one is uploaded.
CREATE POLICY "Authenticated can delete logos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'logos');

-- Informational comment:
-- Why TO authenticated? The admin user uploading the logo is an authenticated user.
-- Why bucket_id = 'logos'? This restricts the policy to only affect files within your "logos" bucket.
-- The USING clause applies to existing rows for SELECT, UPDATE, DELETE.
-- The WITH CHECK clause applies to new rows for INSERT and UPDATE.
