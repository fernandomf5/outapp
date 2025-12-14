-- Add section_background_color and text_color columns to briefings table
ALTER TABLE public.briefings ADD COLUMN IF NOT EXISTS section_background_color TEXT DEFAULT '#ffffff';
ALTER TABLE public.briefings ADD COLUMN IF NOT EXISTS text_color TEXT DEFAULT '#1a1a2e';