-- Remove campos obsoletos da tabela custom_pages
ALTER TABLE public.custom_pages DROP COLUMN IF EXISTS location CASCADE;
ALTER TABLE public.custom_pages DROP COLUMN IF EXISTS open_as_popup CASCADE;