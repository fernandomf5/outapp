
ALTER TABLE public.catalogs ADD COLUMN IF NOT EXISTS payment_settings jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.catalog_orders
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS payment_id text,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS pix_payload text;

CREATE TABLE IF NOT EXISTS public.catalog_payment_credentials (
  catalog_id uuid PRIMARY KEY REFERENCES public.catalogs(id) ON DELETE CASCADE,
  mp_access_token text,
  mp_public_key text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.catalog_payment_credentials TO authenticated;
GRANT ALL ON public.catalog_payment_credentials TO service_role;

ALTER TABLE public.catalog_payment_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage catalog payment credentials"
ON public.catalog_payment_credentials FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.catalogs c WHERE c.id = catalog_id AND c.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.catalogs c WHERE c.id = catalog_id AND c.user_id = auth.uid()));

CREATE TRIGGER catalog_payment_credentials_updated_at
BEFORE UPDATE ON public.catalog_payment_credentials
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.catalog_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_id uuid NOT NULL REFERENCES public.catalogs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  title text NOT NULL,
  slug text NOT NULL,
  content text NOT NULL DEFAULT '',
  is_published boolean NOT NULL DEFAULT true,
  show_in_menu boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (catalog_id, slug)
);

GRANT SELECT ON public.catalog_pages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.catalog_pages TO authenticated;
GRANT ALL ON public.catalog_pages TO service_role;

ALTER TABLE public.catalog_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published catalog pages"
ON public.catalog_pages FOR SELECT
USING (is_published = true AND EXISTS (SELECT 1 FROM public.catalogs c WHERE c.id = catalog_id AND c.is_active = true));

CREATE POLICY "Owners manage their catalog pages"
ON public.catalog_pages FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.catalogs c WHERE c.id = catalog_id AND c.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.catalogs c WHERE c.id = catalog_id AND c.user_id = auth.uid()));

CREATE TRIGGER catalog_pages_updated_at
BEFORE UPDATE ON public.catalog_pages
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Visitors can register as catalog customers"
ON public.catalog_customers FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.catalogs c WHERE c.id = catalog_id AND c.is_active = true));
