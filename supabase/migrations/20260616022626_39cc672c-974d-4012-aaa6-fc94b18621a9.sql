CREATE TABLE public.customer_resource_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  resource_type text NOT NULL,
  resource_id uuid NOT NULL,
  resource_title text,
  resource_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (customer_id, resource_type, resource_id)
);

CREATE INDEX idx_crl_customer ON public.customer_resource_links(customer_id, created_at DESC);
CREATE INDEX idx_crl_user ON public.customer_resource_links(user_id);
CREATE INDEX idx_crl_resource ON public.customer_resource_links(resource_type, resource_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_resource_links TO authenticated;
GRANT ALL ON public.customer_resource_links TO service_role;

ALTER TABLE public.customer_resource_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own customer resource links"
ON public.customer_resource_links
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);