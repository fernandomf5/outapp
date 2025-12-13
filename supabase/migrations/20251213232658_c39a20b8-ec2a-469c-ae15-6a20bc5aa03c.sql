-- Add introduction_images column to commercial_proposals
ALTER TABLE public.commercial_proposals
ADD COLUMN IF NOT EXISTS introduction_images jsonb DEFAULT '[]'::jsonb;