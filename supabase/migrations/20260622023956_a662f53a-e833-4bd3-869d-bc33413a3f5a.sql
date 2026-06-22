
ALTER TABLE public.popups
  ADD COLUMN IF NOT EXISTS countdown_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS countdown_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS countdown_bg_color text DEFAULT '#111827',
  ADD COLUMN IF NOT EXISTS countdown_text_color text DEFAULT '#ffffff',
  ADD COLUMN IF NOT EXISTS countdown_label text DEFAULT 'Oferta termina em:';

ALTER TABLE public.marketing_questionnaires
  ADD COLUMN IF NOT EXISTS button_color text DEFAULT '#6366f1',
  ADD COLUMN IF NOT EXISTS button_text_color text DEFAULT '#ffffff',
  ADD COLUMN IF NOT EXISTS background_color text DEFAULT '#ffffff',
  ADD COLUMN IF NOT EXISTS question_color text DEFAULT '#0f172a',
  ADD COLUMN IF NOT EXISTS text_color text DEFAULT '#334155',
  ADD COLUMN IF NOT EXISTS button_animation text DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS countdown_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS countdown_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS countdown_bg_color text DEFAULT '#111827',
  ADD COLUMN IF NOT EXISTS countdown_text_color text DEFAULT '#ffffff',
  ADD COLUMN IF NOT EXISTS countdown_label text DEFAULT 'Oferta termina em:';
