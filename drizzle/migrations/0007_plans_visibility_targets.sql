ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS show_on_landing BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_in_dashboard BOOLEAN NOT NULL DEFAULT true;

UPDATE public.plans SET show_in_dashboard = false WHERE plan_type = 'free_trial';