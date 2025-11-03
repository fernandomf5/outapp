-- Adicionar campos de sobreposição de fundo em link_bios
ALTER TABLE link_bios 
ADD COLUMN IF NOT EXISTS background_overlay_color TEXT DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS background_overlay_opacity INTEGER DEFAULT 0;

-- Adicionar campos de mídia em popups
ALTER TABLE popups
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS video_url TEXT;