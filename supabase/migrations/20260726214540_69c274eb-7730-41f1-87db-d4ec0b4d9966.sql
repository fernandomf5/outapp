CREATE TABLE public.capture_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'Nova página de captura',
  internal_note TEXT,
  slug TEXT NOT NULL UNIQUE,
  is_published BOOLEAN NOT NULL DEFAULT false,
  blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
  theme JSONB NOT NULL DEFAULT '{}'::jsonb,
  form_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  views INTEGER NOT NULL DEFAULT 0,
  conversions INTEGER NOT NULL DEFAULT 0,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT ON public.capture_pages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.capture_pages TO authenticated;
GRANT ALL ON public.capture_pages TO service_role;

ALTER TABLE public.capture_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their capture pages"
ON public.capture_pages FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view published capture pages"
ON public.capture_pages FOR SELECT TO anon, authenticated
USING (is_published = true);

CREATE TABLE public.capture_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID NOT NULL REFERENCES public.capture_pages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  name TEXT,
  email TEXT,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'novo',
  source TEXT,
  utm JSONB NOT NULL DEFAULT '{}'::jsonb,
  referrer TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT INSERT ON public.capture_leads TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.capture_leads TO authenticated;
GRANT ALL ON public.capture_leads TO service_role;

ALTER TABLE public.capture_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their capture leads"
ON public.capture_leads FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can submit a capture lead"
ON public.capture_leads FOR INSERT TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.capture_pages p
    WHERE p.id = page_id AND p.is_published = true AND p.user_id = capture_leads.user_id
  )
);

CREATE INDEX idx_capture_leads_page ON public.capture_leads(page_id);
CREATE INDEX idx_capture_leads_user ON public.capture_leads(user_id);
CREATE INDEX idx_capture_pages_slug ON public.capture_pages(slug);

CREATE TRIGGER update_capture_pages_updated_at
BEFORE UPDATE ON public.capture_pages
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_capture_leads_updated_at
BEFORE UPDATE ON public.capture_leads
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();