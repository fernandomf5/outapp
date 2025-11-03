-- Adicionar campos de controle de tempo de acesso
ALTER TABLE agent_access_requests 
ADD COLUMN access_duration_days integer,
ADD COLUMN expires_at timestamp with time zone,
ADD COLUMN is_active boolean DEFAULT true;