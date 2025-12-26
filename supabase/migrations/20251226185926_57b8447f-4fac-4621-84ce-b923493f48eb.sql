-- Adicionar campos de personalização avançada ao portfólio
ALTER TABLE public.portfolios
ADD COLUMN IF NOT EXISTS background_color VARCHAR(20) DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS overlay_color VARCHAR(20) DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS overlay_opacity DECIMAL(3,2) DEFAULT 0.40,
ADD COLUMN IF NOT EXISTS title_color VARCHAR(20) DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS description_color VARCHAR(20) DEFAULT '#f0f0f0',
ADD COLUMN IF NOT EXISTS card_background_color VARCHAR(20) DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS card_text_color VARCHAR(20) DEFAULT '#1a1a2e';