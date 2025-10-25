-- Adicionar colunas de animação na tabela link_bios
ALTER TABLE public.link_bios
ADD COLUMN IF NOT EXISTS border_animation TEXT DEFAULT 'none',
ADD COLUMN IF NOT EXISTS hover_animation TEXT DEFAULT 'none';