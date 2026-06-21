ALTER TABLE public.financial_businesses ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_financial_businesses_user_sort ON public.financial_businesses(user_id, sort_order);
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) - 1 AS rn
  FROM public.financial_businesses
)
UPDATE public.financial_businesses fb SET sort_order = ranked.rn FROM ranked WHERE fb.id = ranked.id;