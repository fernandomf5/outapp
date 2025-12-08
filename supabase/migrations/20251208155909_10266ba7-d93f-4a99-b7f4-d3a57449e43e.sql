-- Add social links column to link_bios table
ALTER TABLE public.link_bios 
ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '[]'::jsonb;