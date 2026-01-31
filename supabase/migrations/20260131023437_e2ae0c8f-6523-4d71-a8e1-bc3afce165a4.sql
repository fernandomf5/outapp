-- Add login color fields to simple_members_areas table
ALTER TABLE public.simple_members_areas 
ADD COLUMN IF NOT EXISTS login_background_color TEXT DEFAULT '#1a1a2e',
ADD COLUMN IF NOT EXISTS login_text_color TEXT DEFAULT '#ffffff';