-- Add button 1 fields
ALTER TABLE public.portfolios ADD COLUMN IF NOT EXISTS button1_label text DEFAULT '';
ALTER TABLE public.portfolios ADD COLUMN IF NOT EXISTS button1_url text DEFAULT '';
ALTER TABLE public.portfolios ADD COLUMN IF NOT EXISTS button1_bg_color text DEFAULT '#3b82f6';
ALTER TABLE public.portfolios ADD COLUMN IF NOT EXISTS button1_text_color text DEFAULT '#ffffff';
ALTER TABLE public.portfolios ADD COLUMN IF NOT EXISTS button1_shadow boolean DEFAULT false;
ALTER TABLE public.portfolios ADD COLUMN IF NOT EXISTS button1_enabled boolean DEFAULT false;

-- Add button 2 fields
ALTER TABLE public.portfolios ADD COLUMN IF NOT EXISTS button2_label text DEFAULT '';
ALTER TABLE public.portfolios ADD COLUMN IF NOT EXISTS button2_url text DEFAULT '';
ALTER TABLE public.portfolios ADD COLUMN IF NOT EXISTS button2_bg_color text DEFAULT '#10b981';
ALTER TABLE public.portfolios ADD COLUMN IF NOT EXISTS button2_text_color text DEFAULT '#ffffff';
ALTER TABLE public.portfolios ADD COLUMN IF NOT EXISTS button2_shadow boolean DEFAULT false;
ALTER TABLE public.portfolios ADD COLUMN IF NOT EXISTS button2_enabled boolean DEFAULT false;