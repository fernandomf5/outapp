-- Add logo_url and order_index columns to financial_businesses table
ALTER TABLE financial_businesses 
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- Set order_index for existing records based on created_at
WITH ranked_businesses AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at ASC) - 1 as new_order
  FROM financial_businesses
  WHERE order_index IS NULL OR order_index = 0
)
UPDATE financial_businesses 
SET order_index = ranked_businesses.new_order
FROM ranked_businesses
WHERE financial_businesses.id = ranked_businesses.id;