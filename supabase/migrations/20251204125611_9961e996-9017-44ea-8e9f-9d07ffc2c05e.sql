-- Add auto_carousel column to commercial_proposals table
ALTER TABLE public.commercial_proposals 
ADD COLUMN IF NOT EXISTS auto_carousel BOOLEAN DEFAULT false;