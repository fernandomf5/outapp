ALTER TABLE public.popups
  ADD COLUMN IF NOT EXISTS button_text_color text DEFAULT '#ffffff',
  ADD COLUMN IF NOT EXISTS button_animation text DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS image_fit text DEFAULT 'cover';