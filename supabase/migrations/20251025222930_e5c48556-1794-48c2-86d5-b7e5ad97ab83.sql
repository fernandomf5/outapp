-- Add authentication fields to chatbot_customers
ALTER TABLE chatbot_customers
ADD COLUMN IF NOT EXISTS password_hash TEXT,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;

-- Make email unique per chatbot
CREATE UNIQUE INDEX IF NOT EXISTS chatbot_customers_email_chatbot_unique 
ON chatbot_customers(chatbot_id, email);