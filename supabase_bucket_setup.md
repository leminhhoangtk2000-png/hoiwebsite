# Supabase Storage Bucket Setup

To fix the "Bucket not found" error when uploading a logo, you need to create a new storage bucket in your Supabase project.

## 1. Create the Bucket

*   **Bucket Name:** `logos`

You can create this bucket through the Supabase dashboard under **Storage** > **Buckets** > **Create bucket**.

## 2. Set Access Policies

After creating the bucket, you need to configure its access policies to allow the application to publicly read the uploaded images.

1.  In the Supabase dashboard, go to the **Storage** section.
2.  Click on the `logos` bucket.
3.  Navigate to the **Policies** tab.
4.  Create a new policy (or edit the existing ones) to grant public read access. The simplest way is to create a policy for the `anon` role with `SELECT` permissions.

Here is an example policy:

*   **Policy Name:** `Public Read Access for Logos`
*   **Allowed operations:** `SELECT`
*   **Target roles:** `anon`

This configuration will allow anyone to view the images in your `logos` bucket, which is necessary for them to be displayed on your website.
