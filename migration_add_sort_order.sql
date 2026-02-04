
-- Run this in your Supabase SQL Editor to enable reordering
ALTER TABLE social_channels 
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Initialize order
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn
  FROM social_channels
)
UPDATE social_channels
SET sort_order = ranked.rn
FROM ranked
WHERE social_channels.id = ranked.id;
