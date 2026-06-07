ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS registration_category_id UUID REFERENCES public.registration_categories(id) ON DELETE SET NULL;
