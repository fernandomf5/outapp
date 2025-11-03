-- Permitir que password_hash seja NULL para acesso privado
ALTER TABLE agent_customers 
ALTER COLUMN password_hash DROP NOT NULL;