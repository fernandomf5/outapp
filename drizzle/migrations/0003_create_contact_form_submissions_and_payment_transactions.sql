CREATE TABLE IF NOT EXISTS public.contact_form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contact_form_submissions_agent_id ON public.contact_form_submissions(agent_id);
CREATE INDEX IF NOT EXISTS idx_contact_form_submissions_created_at ON public.contact_form_submissions(created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_form_submissions TO authenticated;
GRANT INSERT ON public.contact_form_submissions TO anon;
GRANT ALL ON public.contact_form_submissions TO service_role;

ALTER TABLE public.contact_form_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit contact forms"
ON public.contact_form_submissions FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Agent owners can view submissions"
ON public.contact_form_submissions FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.ai_agents a WHERE a.id = contact_form_submissions.agent_id AND a.user_id = auth.uid()));

CREATE POLICY "Agent owners can update submissions"
ON public.contact_form_submissions FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.ai_agents a WHERE a.id = contact_form_submissions.agent_id AND a.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.ai_agents a WHERE a.id = contact_form_submissions.agent_id AND a.user_id = auth.uid()));

CREATE POLICY "Agent owners can delete submissions"
ON public.contact_form_submissions FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.ai_agents a WHERE a.id = contact_form_submissions.agent_id AND a.user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'BRL',
  status TEXT NOT NULL DEFAULT 'pending',
  provider TEXT,
  external_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON public.payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON public.payment_transactions(created_at DESC);

GRANT SELECT ON public.payment_transactions TO authenticated;
GRANT ALL ON public.payment_transactions TO service_role;

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
ON public.payment_transactions FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));