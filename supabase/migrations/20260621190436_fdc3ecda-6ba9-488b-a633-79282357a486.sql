GRANT INSERT ON public.customers TO anon;

CREATE POLICY "Public can insert quiz leads"
ON public.customers
FOR INSERT
TO anon, authenticated
WITH CHECK (
  status = 'lead'
  AND EXISTS (
    SELECT 1 FROM public.quizzes q
    WHERE q.user_id = customers.user_id
      AND q.is_active = true
  )
);