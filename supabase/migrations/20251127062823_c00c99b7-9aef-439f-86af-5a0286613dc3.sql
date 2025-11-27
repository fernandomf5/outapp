-- Add logo_url column to simple_members_areas for members area logo
ALTER TABLE public.simple_members_areas
ADD COLUMN IF NOT EXISTS logo_url text;