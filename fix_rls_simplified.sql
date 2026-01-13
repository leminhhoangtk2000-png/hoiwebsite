-- Simplified RLS Policies for "logos" bucket

-- It seems you encountered a permission error with the previous script.
-- This is often because Row-Level Security (RLS) is already enabled by default on Supabase Storage.
-- This simplified script skips the command that enables RLS and only focuses on creating the necessary permissions.

-- Please run this entire script in the Supabase SQL Editor.

-- Policy 1: Allow authenticated users to VIEW logos.
CREATE POLICY "Authenticated can select logos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'logos');

-- Policy 2: Allow authenticated users to UPLOAD new logos.
CREATE POLICY "Authenticated can insert logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'logos');

-- Policy 3: Allow authenticated users to UPDATE/REPLACE logos.
CREATE POLICY "Authenticated can update logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'logos');

-- Policy 4: Allow authenticated users to DELETE old logos.
CREATE POLICY "Authenticated can delete logos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'logos');
