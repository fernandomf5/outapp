-- Add button_spacing column to link_bios table
ALTER TABLE public.link_bios 
ADD COLUMN button_spacing INTEGER DEFAULT 12;