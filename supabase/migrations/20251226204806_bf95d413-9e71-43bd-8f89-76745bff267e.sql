-- Add button_bg_color column to portfolios table for category button background color
ALTER TABLE public.portfolios 
ADD COLUMN IF NOT EXISTS button_bg_color TEXT DEFAULT '#e5e5e5';