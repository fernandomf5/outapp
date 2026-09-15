ALTER TABLE public.custom_pages ALTER COLUMN location SET DEFAULT 'footer';
UPDATE public.custom_pages SET location = 'footer' WHERE location IS NULL;