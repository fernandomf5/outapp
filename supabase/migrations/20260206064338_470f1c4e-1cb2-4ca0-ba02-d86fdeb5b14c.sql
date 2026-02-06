-- Add custom code fields to catalogs table
ALTER TABLE public.catalogs 
ADD COLUMN IF NOT EXISTS head_code text,
ADD COLUMN IF NOT EXISTS footer_code text;