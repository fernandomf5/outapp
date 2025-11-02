-- Add keywords column to chatbot_flows
ALTER TABLE chatbot_flows 
ADD COLUMN IF NOT EXISTS keywords text[] DEFAULT ARRAY[]::text[];