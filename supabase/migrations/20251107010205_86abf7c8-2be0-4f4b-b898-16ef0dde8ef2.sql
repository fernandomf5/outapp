-- Adicionar coluna show_in_menu à tabela custom_pages
ALTER TABLE public.custom_pages 
ADD COLUMN IF NOT EXISTS show_in_menu boolean DEFAULT true;

-- Atualizar páginas existentes para aparecer no menu por padrão
UPDATE public.custom_pages 
SET show_in_menu = true 
WHERE show_in_menu IS NULL;