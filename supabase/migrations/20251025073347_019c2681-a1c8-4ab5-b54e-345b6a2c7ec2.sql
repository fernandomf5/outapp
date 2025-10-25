-- Add border_radius column to link_bios table
ALTER TABLE public.link_bios 
ADD COLUMN border_radius integer DEFAULT 12;