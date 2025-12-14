-- Add background_color column to briefings table
ALTER TABLE public.briefings ADD COLUMN IF NOT EXISTS background_color TEXT DEFAULT '#1a1a2e';