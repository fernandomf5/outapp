-- Add cascade delete for agent_customers when agent is deleted
-- This ensures that when an agent is deleted, all related customer data is also removed

-- Drop existing foreign key and recreate with CASCADE
ALTER TABLE agent_customers
DROP CONSTRAINT IF EXISTS agent_customers_agent_id_fkey;

ALTER TABLE agent_customers
ADD CONSTRAINT agent_customers_agent_id_fkey 
FOREIGN KEY (agent_id) 
REFERENCES ai_agents(id) 
ON DELETE CASCADE;

-- Also ensure other related tables cascade properly
ALTER TABLE agent_conversations
DROP CONSTRAINT IF EXISTS agent_conversations_customer_id_fkey;

ALTER TABLE agent_conversations
ADD CONSTRAINT agent_conversations_customer_id_fkey 
FOREIGN KEY (customer_id) 
REFERENCES agent_customers(id) 
ON DELETE CASCADE;

ALTER TABLE agent_appointments
DROP CONSTRAINT IF EXISTS agent_appointments_customer_id_fkey;

ALTER TABLE agent_appointments
ADD CONSTRAINT agent_appointments_customer_id_fkey 
FOREIGN KEY (customer_id) 
REFERENCES agent_customers(id) 
ON DELETE CASCADE;

ALTER TABLE agent_orders
DROP CONSTRAINT IF EXISTS agent_orders_customer_id_fkey;

ALTER TABLE agent_orders
ADD CONSTRAINT agent_orders_customer_id_fkey 
FOREIGN KEY (customer_id) 
REFERENCES agent_customers(id) 
ON DELETE CASCADE;

ALTER TABLE agent_reviews
DROP CONSTRAINT IF EXISTS agent_reviews_customer_id_fkey;

ALTER TABLE agent_reviews
ADD CONSTRAINT agent_reviews_customer_id_fkey 
FOREIGN KEY (customer_id) 
REFERENCES agent_customers(id) 
ON DELETE CASCADE;

ALTER TABLE agent_password_resets
DROP CONSTRAINT IF EXISTS agent_password_resets_customer_id_fkey;

ALTER TABLE agent_password_resets
ADD CONSTRAINT agent_password_resets_customer_id_fkey 
FOREIGN KEY (customer_id) 
REFERENCES agent_customers(id) 
ON DELETE CASCADE;

ALTER TABLE agent_access_requests
DROP CONSTRAINT IF EXISTS agent_access_requests_customer_id_fkey;

ALTER TABLE agent_access_requests
ADD CONSTRAINT agent_access_requests_customer_id_fkey 
FOREIGN KEY (customer_id) 
REFERENCES agent_customers(id) 
ON DELETE CASCADE;