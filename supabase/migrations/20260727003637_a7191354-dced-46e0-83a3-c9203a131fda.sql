ALTER TABLE public.registration_categories
ADD COLUMN IF NOT EXISTS item_group_images jsonb NOT NULL DEFAULT '{}'::jsonb;