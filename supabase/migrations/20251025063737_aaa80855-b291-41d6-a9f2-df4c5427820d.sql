-- Adicionar colunas de borda na tabela link_bios
ALTER TABLE public.link_bios
ADD COLUMN IF NOT EXISTS border_style TEXT DEFAULT 'solid',
ADD COLUMN IF NOT EXISTS border_width INTEGER DEFAULT 2,
ADD COLUMN IF NOT EXISTS border_color TEXT DEFAULT '#000000';