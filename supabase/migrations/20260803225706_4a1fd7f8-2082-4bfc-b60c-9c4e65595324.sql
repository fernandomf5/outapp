DROP POLICY IF EXISTS "Anyone can create checkout orders" ON public.checkout_orders;
CREATE POLICY "Anyone can create checkout orders"
ON public.checkout_orders FOR INSERT
TO anon, authenticated
WITH CHECK (true);
GRANT INSERT ON public.checkout_orders TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.checkout_orders TO authenticated;
GRANT ALL ON public.checkout_orders TO service_role;