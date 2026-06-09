ALTER TABLE public.checkouts ADD COLUMN IF NOT EXISTS custom_settings JSONB DEFAULT '{}'::jsonb;
GRANT ALL ON public.checkouts TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.checkouts TO authenticated;