-- Phase 2: Additional tables for checkout and admin features

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  address TEXT NOT NULL
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, paid, shipped
  total_amount NUMERIC(10, 2) NOT NULL,
  coupon_code TEXT,
  discount_amount NUMERIC(10, 2) DEFAULT 0
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  color TEXT NOT NULL,
  size TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  image_url TEXT
);

-- Coupons table
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  code TEXT UNIQUE NOT NULL,
  discount_percent NUMERIC(5, 2) NOT NULL, -- e.g., 10.00 for 10%
  is_active BOOLEAN DEFAULT true
);

-- Site settings table (single row)
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  logo_url TEXT,
  hero_banner_url TEXT,
  payment_qr_url TEXT,
  bank_info TEXT
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL
);

-- Insert default site settings (single row)
INSERT INTO site_settings (logo_url, hero_banner_url, payment_qr_url, bank_info)
VALUES (
  NULL,
  NULL,
  NULL,
  'Bank: ABC Bank\nAccount Number: 1234567890\nAccount Name: UNIQLO CLONE'
)
ON CONFLICT DO NOTHING;

-- Insert sample categories
INSERT INTO categories (name, slug) VALUES
  ('Men', 'men'),
  ('Women', 'women'),
  ('Kids', 'kids')
ON CONFLICT (slug) DO NOTHING;

-- Insert sample coupon
INSERT INTO coupons (code, discount_percent, is_active) VALUES
  ('WELCOME10', 10.00, true),
  ('SAVE20', 20.00, true)
ON CONFLICT (code) DO NOTHING;

