-- Adicionar coluna client_name na tabela ad_campaigns
ALTER TABLE ad_campaigns ADD COLUMN IF NOT EXISTS client_name TEXT;