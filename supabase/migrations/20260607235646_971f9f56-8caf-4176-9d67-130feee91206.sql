ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.registration_categories ADD COLUMN IF NOT EXISTS logo_url TEXT;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contacts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.registration_categories TO authenticated;
GRANT ALL ON public.contacts TO service_role;
GRANT ALL ON public.registration_categories TO service_role;