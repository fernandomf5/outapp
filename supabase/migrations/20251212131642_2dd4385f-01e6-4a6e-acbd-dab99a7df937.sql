-- Add column for marking images as scrollable screenshots
ALTER TABLE public.portfolio_items ADD COLUMN IF NOT EXISTS is_scrollable_screenshot boolean DEFAULT false;