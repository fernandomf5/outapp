
CREATE TABLE public.contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  client_name TEXT,
  client_email TEXT,
  client_phone TEXT,
  client_document TEXT,
  company_name TEXT,
  company_document TEXT,
  access_code TEXT NOT NULL,
  public_slug TEXT NOT NULL UNIQUE DEFAULT replace(gen_random_uuid()::text,'-',''),
  status TEXT NOT NULL DEFAULT 'draft',
  client_signature TEXT,
  client_signed_at TIMESTAMPTZ,
  client_signer_name TEXT,
  client_signer_ip TEXT,
  company_signature TEXT,
  company_signed_at TIMESTAMPTZ,
  company_signer_name TEXT,
  sent_at TIMESTAMPTZ,
  views_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_contracts_user ON public.contracts(user_id);
CREATE INDEX idx_contracts_slug ON public.contracts(public_slug);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contracts TO authenticated;
GRANT SELECT, UPDATE ON public.contracts TO anon;
GRANT ALL ON public.contracts TO service_role;

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner manages contracts" ON public.contracts
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can view contracts" ON public.contracts
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Public can sign contracts" ON public.contracts
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER trg_contracts_updated_at
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.contract_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_contract_history_contract ON public.contract_history(contract_id);

GRANT SELECT, INSERT ON public.contract_history TO authenticated, anon;
GRANT ALL ON public.contract_history TO service_role;

ALTER TABLE public.contract_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner reads history" ON public.contract_history
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.contracts c WHERE c.id = contract_id AND c.user_id = auth.uid()));

CREATE POLICY "Anyone inserts history" ON public.contract_history
  FOR INSERT TO anon, authenticated WITH CHECK (true);
