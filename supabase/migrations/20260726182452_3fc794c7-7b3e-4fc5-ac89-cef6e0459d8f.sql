GRANT INSERT ON public.contact_form_submissions TO anon;
GRANT INSERT, SELECT, UPDATE, DELETE ON public.contact_form_submissions TO authenticated;
GRANT ALL ON public.contact_form_submissions TO service_role;