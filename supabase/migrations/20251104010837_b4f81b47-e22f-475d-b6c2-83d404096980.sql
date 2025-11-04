-- Add new design columns to popups table
ALTER TABLE public.popups 
ADD COLUMN IF NOT EXISTS background_color TEXT DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS background_image TEXT,
ADD COLUMN IF NOT EXISTS background_video TEXT,
ADD COLUMN IF NOT EXISTS button_color TEXT DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS text_color TEXT DEFAULT '#000000';