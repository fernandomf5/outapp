CREATE TABLE public.checkout_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  checkout_id UUID NOT NULL REFERENCES public.checkouts(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  session_id TEXT,
  referrer TEXT,
  device TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_checkout_events_checkout ON public.checkout_events(checkout_id, created_at DESC);

GRANT INSERT ON public.checkout_events TO anon;
GRANT SELECT, INSERT ON public.checkout_events TO authenticated;
GRANT ALL ON public.checkout_events TO service_role;

ALTER TABLE public.checkout_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can record checkout events"
ON public.checkout_events FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Owners can view their checkout events"
ON public.checkout_events FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.checkouts c WHERE c.id = checkout_events.checkout_id AND c.user_id = auth.uid()));