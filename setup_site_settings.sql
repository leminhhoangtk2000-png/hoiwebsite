-- Create the site_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

-- Insert the initial settings with empty or default values
-- This ensures that the application has a record to update
INSERT INTO site_settings (key, value) VALUES
  ('site_title', 'My Awesome Website'),
  ('logo_url', ''),
  ('home_banner_text', 'Welcome to our store!'),
  ('payment_qr_url', ''),
  ('bank_info', '')
ON CONFLICT (key) DO NOTHING;
