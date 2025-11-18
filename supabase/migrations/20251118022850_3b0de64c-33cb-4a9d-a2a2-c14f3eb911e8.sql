-- Add order_index to financial_categories
ALTER TABLE financial_categories 
ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_financial_categories_order 
ON financial_categories(business_id, order_index);