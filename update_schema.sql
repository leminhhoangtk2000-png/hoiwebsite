-- PART 1: Database & Settings Update

-- Create social_channels table
CREATE TABLE IF NOT EXISTS social_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  icon_code TEXT NOT NULL, -- e.g., "Facebook", "Instagram", "Twitter" for lucide-react
  link TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true
);

-- Insert default social channels
INSERT INTO social_channels (name, icon_code, link, is_active) VALUES
  ('Facebook', 'Facebook', 'https://facebook.com', true),
  ('Instagram', 'Instagram', 'https://instagram.com', true),
  ('Twitter', 'Twitter', 'https://twitter.com', true)
ON CONFLICT DO NOTHING;

-- Update site_settings table to add new text fields
-- First, check if columns exist, if not add them
DO $$ 
BEGIN
  -- Add home_banner_text if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'site_settings' AND column_name = 'home_banner_text'
  ) THEN
    ALTER TABLE site_settings ADD COLUMN home_banner_text TEXT;
  END IF;

  -- Add home_section_title if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'site_settings' AND column_name = 'home_section_title'
  ) THEN
    ALTER TABLE site_settings ADD COLUMN home_section_title TEXT;
  END IF;
END $$;

-- Update existing site_settings row with default values
UPDATE site_settings SET
  home_banner_text = COALESCE(home_banner_text, 'LifeWear Collection'),
  home_section_title = COALESCE(home_section_title, 'New Arrivals')
WHERE home_banner_text IS NULL OR home_section_title IS NULL;

-- If no row exists, create one with all defaults
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM site_settings LIMIT 1) THEN
    INSERT INTO site_settings (
      logo_url,
      hero_banner_url,
      payment_qr_url,
      bank_info,
      home_banner_text,
      home_section_title
    ) VALUES (
      NULL,
      NULL,
      NULL,
      'Bank: ABC Bank\nAccount Number: 1234567890\nAccount Name: UNIQLO CLONE',
      'LifeWear Collection',
      'New Arrivals'
    );
  END IF;
END $$;

