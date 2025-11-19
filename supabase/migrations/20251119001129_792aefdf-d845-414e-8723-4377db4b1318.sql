-- Add fields for recurring transactions and manual ordering
ALTER TABLE financial_transactions 
ADD COLUMN IF NOT EXISTS is_recurring boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS order_index integer DEFAULT 0;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_financial_transactions_order 
ON financial_transactions(business_id, order_index);