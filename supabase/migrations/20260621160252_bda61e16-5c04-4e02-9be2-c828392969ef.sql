ALTER TABLE public.registration_categories ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY name) AS rn
  FROM public.registration_categories
)
UPDATE public.registration_categories rc
SET sort_order = ordered.rn
FROM ordered
WHERE rc.id = ordered.id AND rc.sort_order = 0;

CREATE INDEX IF NOT EXISTS idx_registration_categories_user_sort ON public.registration_categories(user_id, sort_order);