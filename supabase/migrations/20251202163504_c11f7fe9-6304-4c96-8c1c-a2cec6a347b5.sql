-- Add generated_code column to floating_buttons table
ALTER TABLE public.floating_buttons 
ADD COLUMN generated_code TEXT;