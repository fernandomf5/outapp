-- Adicionar campos de contagem regressiva na tabela plans
ALTER TABLE plans 
ADD COLUMN IF NOT EXISTS countdown_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS countdown_ends_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS limited_offer_banner TEXT;