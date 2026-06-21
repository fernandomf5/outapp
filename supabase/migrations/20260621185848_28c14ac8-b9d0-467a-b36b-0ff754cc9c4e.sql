ALTER TABLE public.quizzes
  ADD COLUMN IF NOT EXISTS result_profiles jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS send_to_crm boolean NOT NULL DEFAULT true;