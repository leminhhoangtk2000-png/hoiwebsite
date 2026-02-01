-- Add parent_id for hierarchy
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES categories(id) ON DELETE SET NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
