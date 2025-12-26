-- Add button_text_color column to portfolios table
ALTER TABLE public.portfolios ADD COLUMN IF NOT EXISTS button_text_color TEXT DEFAULT '#1a1a2e';