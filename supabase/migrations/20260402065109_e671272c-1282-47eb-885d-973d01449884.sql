CREATE POLICY "Users can delete their own checkout orders"
ON public.checkout_orders
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);