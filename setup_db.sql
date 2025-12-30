-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  category TEXT NOT NULL,
  main_image_url TEXT,
  variants JSONB DEFAULT '[]'::jsonb
);

-- Insert sample products with Uniqlo-like data
INSERT INTO products (name, description, price, category, main_image_url, variants) VALUES
(
  'HEATTECH Crew Neck T-Shirt',
  'Made with HEATTECH technology that generates heat from the moisture your body releases. Soft, stretchy fabric with a comfortable fit.',
  19.90,
  'Men',
  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=1000&fit=crop',
  '[
    {
      "color": "Black",
      "hex": "#000000",
      "sizes": ["S", "M", "L", "XL"],
      "image_url": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=1000&fit=crop"
    },
    {
      "color": "White",
      "hex": "#FFFFFF",
      "sizes": ["S", "M", "L", "XL"],
      "image_url": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=1000&fit=crop"
    },
    {
      "color": "Navy",
      "hex": "#1E3A5F",
      "sizes": ["M", "L", "XL"],
      "image_url": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=1000&fit=crop"
    }
  ]'::jsonb
),
(
  'AIRism Cotton Crew Neck T-Shirt',
  'AIRism fabric with excellent moisture-wicking and quick-drying properties. Smooth, lightweight texture that feels great against the skin.',
  14.90,
  'Men',
  'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&h=1000&fit=crop',
  '[
    {
      "color": "Gray",
      "hex": "#808080",
      "sizes": ["S", "M", "L", "XL", "XXL"],
      "image_url": "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&h=1000&fit=crop"
    },
    {
      "color": "Black",
      "hex": "#000000",
      "sizes": ["S", "M", "L", "XL"],
      "image_url": "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&h=1000&fit=crop"
    },
    {
      "color": "White",
      "hex": "#FFFFFF",
      "sizes": ["S", "M", "L", "XL", "XXL"],
      "image_url": "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&h=1000&fit=crop"
    }
  ]'::jsonb
),
(
  'Ultra Light Down Parka',
  'Lightweight down parka with excellent warmth-to-weight ratio. Water-repellent finish and packable design for easy storage.',
  99.90,
  'Women',
  'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&h=1000&fit=crop',
  '[
    {
      "color": "Black",
      "hex": "#000000",
      "sizes": ["XS", "S", "M", "L"],
      "image_url": "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&h=1000&fit=crop"
    },
    {
      "color": "Navy",
      "hex": "#1E3A5F",
      "sizes": ["S", "M", "L"],
      "image_url": "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&h=1000&fit=crop"
    },
    {
      "color": "Beige",
      "hex": "#F5F5DC",
      "sizes": ["XS", "S", "M"],
      "image_url": "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&h=1000&fit=crop"
    }
  ]'::jsonb
);

