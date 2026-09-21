ALTER TABLE public.agenda_events
  ADD COLUMN IF NOT EXISTS reminder_repeat_minutes INTEGER NOT NULL DEFAULT 0;