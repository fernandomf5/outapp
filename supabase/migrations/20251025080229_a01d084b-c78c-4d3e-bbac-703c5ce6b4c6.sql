-- Remove custom_slug column and add custom_domain column
ALTER TABLE public.link_bios 
DROP COLUMN IF EXISTS custom_slug;

ALTER TABLE public.link_bios 
ADD COLUMN custom_domain TEXT UNIQUE;

-- Add index for faster lookups
CREATE INDEX idx_link_bios_custom_domain ON public.link_bios(custom_domain) WHERE custom_domain IS NOT NULL;