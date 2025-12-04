-- Add image fields to commercial_proposals
ALTER TABLE public.commercial_proposals
ADD COLUMN IF NOT EXISTS introduction_image_url TEXT,
ADD COLUMN IF NOT EXISTS services_images JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS timeline_image_url TEXT,
ADD COLUMN IF NOT EXISTS company_description TEXT;