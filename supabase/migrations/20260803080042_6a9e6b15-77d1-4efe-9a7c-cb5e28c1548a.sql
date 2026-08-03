
ALTER TABLE public.checkouts ADD COLUMN IF NOT EXISTS billing_day integer;
ALTER TABLE public.checkout_subscriptions ADD COLUMN IF NOT EXISTS billing_day integer;
GRANT ALL ON public.checkouts TO authenticated;
GRANT ALL ON public.checkout_subscriptions TO authenticated;
GRANT ALL ON public.checkouts TO service_role;
GRANT ALL ON public.checkout_subscriptions TO service_role;
