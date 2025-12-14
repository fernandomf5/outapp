-- Add field background color column to briefings table
ALTER TABLE public.briefings
ADD COLUMN field_background_color TEXT DEFAULT '#ffffff';