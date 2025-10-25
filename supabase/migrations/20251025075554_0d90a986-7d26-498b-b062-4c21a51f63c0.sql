-- Add custom_slug column to link_bios table
ALTER TABLE public.link_bios 
ADD COLUMN custom_slug TEXT UNIQUE;

-- Add index for faster lookups
CREATE INDEX idx_link_bios_custom_slug ON public.link_bios(custom_slug) WHERE custom_slug IS NOT NULL;