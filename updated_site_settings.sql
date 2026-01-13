-- This script creates the 'site_settings' table and populates it with the essential keys.
-- The logo is now stored as a 'logo_path' relative to the 'logos' bucket.

-- Create the site_settings table if it doesn't already exist.
-- This table uses a simple key-value structure to store various site configurations.
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

-- Insert the initial settings with default or empty values.
-- This ensures that the application has a record to update for each setting.
-- The ON CONFLICT clause prevents errors if the keys already exist.
INSERT INTO site_settings (key, value) VALUES
  ('site_title', 'My Awesome Website'),
  ('logo_path', ''), -- Changed from logo_url
  ('payment_qr_url', ''),
  ('bank_info', '')
ON CONFLICT (key) DO NOTHING;