-- Novo módulo: Criador de Sites
CREATE TABLE public.sites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  site_type TEXT NOT NULL DEFAULT 'institucional',
  niche TEXT,
  niche_group TEXT,
  theme JSONB NOT NULL DEFAULT '{}'::jsonb,
  seo JSONB NOT NULL DEFAULT '{}'::jsonb,
  integrations JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_published BOOLEAN NOT NULL DEFAULT false,
  custom_domain TEXT,
  views INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.site_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Início',
  path TEXT NOT NULL DEFAULT '',
  blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
  seo JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_home BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sites_user_id ON public.sites(user_id);
CREATE INDEX idx_site_pages_site_id ON public.site_pages(site_id);
CREATE UNIQUE INDEX idx_site_pages_site_path ON public.site_pages(site_id, path);

GRANT SELECT ON public.sites TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sites TO authenticated;
GRANT ALL ON public.sites TO service_role;

GRANT SELECT ON public.site_pages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_pages TO authenticated;
GRANT ALL ON public.site_pages TO service_role;

ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their sites"
  ON public.sites FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Published sites are viewable by everyone"
  ON public.sites FOR SELECT TO anon, authenticated
  USING (is_published = true);

CREATE POLICY "Owners manage their site pages"
  ON public.site_pages FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.sites s WHERE s.id = site_pages.site_id AND s.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.sites s WHERE s.id = site_pages.site_id AND s.user_id = auth.uid()));

CREATE POLICY "Pages of published sites are viewable by everyone"
  ON public.site_pages FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.sites s WHERE s.id = site_pages.site_id AND s.is_published = true));

CREATE TRIGGER update_sites_updated_at BEFORE UPDATE ON public.sites
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_site_pages_updated_at BEFORE UPDATE ON public.site_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Remoção dos criadores antigos
DROP TABLE IF EXISTS public.capture_leads CASCADE;
DROP TABLE IF EXISTS public.capture_pages CASCADE;
DROP TABLE IF EXISTS public.portfolio_messages CASCADE;
DROP TABLE IF EXISTS public.portfolio_items CASCADE;
DROP TABLE IF EXISTS public.portfolios CASCADE;
DROP TABLE IF EXISTS public.catalog_banners CASCADE;
DROP TABLE IF EXISTS public.catalog_orders CASCADE;
DROP TABLE IF EXISTS public.catalog_customers CASCADE;
DROP TABLE IF EXISTS public.catalog_pages CASCADE;
DROP TABLE IF EXISTS public.catalog_payment_credentials CASCADE;
DROP TABLE IF EXISTS public.catalogs CASCADE;
DROP FUNCTION IF EXISTS public.increment_capture_page_view(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.increment_capture_page_conversion() CASCADE;
DROP FUNCTION IF EXISTS public.increment_portfolio_view(uuid) CASCADE;

CREATE OR REPLACE FUNCTION public.increment_site_view(_site_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path TO 'public'
AS $$
  UPDATE public.sites SET views = views + 1 WHERE id = _site_id AND is_published = true;
$$;