-- This script corrects the RLS policies for the 'logos' bucket
-- to allow public viewing while restricting management to logged-in users.
-- Please run this entire script in your Supabase SQL Editor.

-- Drop the previous "all-in-one" policy and any other old policies.
DROP POLICY IF EXISTS "Authenticated users can manage logos" ON storage.objects;
DROP POLICY IF EXISTS "Public Read Access for Logos" ON storage.objects;
DROP POLICY IF EXISTS "Logos are publicly viewable" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can manage logo uploads" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can select logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can insert logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete logos" ON storage.objects;


-- 1. Create a policy to allow PUBLIC READ access to logos.
-- This allows the logo to be displayed on your public website to all visitors.
CREATE POLICY "Logos are publicly viewable"
ON storage.objects
FOR SELECT
TO anon, authenticated -- Grant to both anonymous and logged-in users
USING (bucket_id = 'logos');


-- 2. Create a policy to allow LOGGED-IN users to upload, update, and delete logos.
-- This secures the management actions to only authenticated users (e.g., admins).
CREATE POLICY "Authenticated users can manage logo uploads"
ON storage.objects
FOR INSERT, UPDATE, DELETE
TO authenticated
USING ( bucket_id = 'logos' AND auth.uid() IS NOT NULL )
WITH CHECK ( bucket_id = 'logos' AND auth.uid() IS NOT NULL );
