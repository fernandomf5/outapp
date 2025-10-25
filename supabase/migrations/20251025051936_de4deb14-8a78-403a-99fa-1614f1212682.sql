-- Tabela para analytics detalhado das páginas clonadas
CREATE TABLE IF NOT EXISTS public.cloned_page_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID NOT NULL REFERENCES public.cloned_pages(id) ON DELETE CASCADE,
  visitor_id TEXT,
  session_id TEXT,
  
  -- Informações do visitante
  ip_address TEXT,
  user_agent TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  
  -- Métricas de engajamento
  time_on_page INTEGER, -- em segundos
  scroll_depth INTEGER, -- porcentagem (0-100)
  clicks_count INTEGER DEFAULT 0,
  
  -- Conversão
  converted BOOLEAN DEFAULT false,
  conversion_type TEXT, -- 'checkout', 'lead_capture', 'exit_intent', etc
  
  -- Device info
  device_type TEXT, -- 'mobile', 'tablet', 'desktop'
  browser TEXT,
  os TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_cloned_page_analytics_page_id ON public.cloned_page_analytics(page_id);
CREATE INDEX IF NOT EXISTS idx_cloned_page_analytics_created_at ON public.cloned_page_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_cloned_page_analytics_converted ON public.cloned_page_analytics(converted);

-- RLS Policies
ALTER TABLE public.cloned_page_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can create analytics"
  ON public.cloned_page_analytics
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view analytics for their pages"
  ON public.cloned_page_analytics
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.cloned_pages
      WHERE cloned_pages.id = cloned_page_analytics.page_id
      AND cloned_pages.user_id = auth.uid()
    )
  );

-- Tabela para captura de leads
CREATE TABLE IF NOT EXISTS public.cloned_page_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID NOT NULL REFERENCES public.cloned_pages(id) ON DELETE CASCADE,
  
  -- Dados do lead
  name TEXT,
  email TEXT,
  phone TEXT,
  custom_fields JSONB DEFAULT '{}'::jsonb,
  
  -- Informações de rastreamento
  visitor_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  
  -- Status
  status TEXT DEFAULT 'new', -- 'new', 'contacted', 'converted', 'lost'
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_cloned_page_leads_page_id ON public.cloned_page_leads(page_id);
CREATE INDEX IF NOT EXISTS idx_cloned_page_leads_email ON public.cloned_page_leads(email);
CREATE INDEX IF NOT EXISTS idx_cloned_page_leads_status ON public.cloned_page_leads(status);

-- RLS Policies
ALTER TABLE public.cloned_page_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can create leads"
  ON public.cloned_page_leads
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can manage leads from their pages"
  ON public.cloned_page_leads
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.cloned_pages
      WHERE cloned_pages.id = cloned_page_leads.page_id
      AND cloned_pages.user_id = auth.uid()
    )
  );

-- Tabela para A/B Testing
CREATE TABLE IF NOT EXISTS public.cloned_page_variants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID NOT NULL REFERENCES public.cloned_pages(id) ON DELETE CASCADE,
  
  -- Configuração da variante
  variant_name TEXT NOT NULL,
  variant_letter TEXT NOT NULL, -- 'A', 'B', 'C', etc
  traffic_percentage INTEGER NOT NULL DEFAULT 50, -- porcentagem do tráfego
  
  -- Configurações específicas da variante
  custom_settings JSONB DEFAULT '{}'::jsonb,
  page_content_changes JSONB DEFAULT '{}'::jsonb, -- mudanças no HTML
  
  -- Métricas
  views INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  conversion_rate NUMERIC DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_winner BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_cloned_page_variants_page_id ON public.cloned_page_variants(page_id);
CREATE INDEX IF NOT EXISTS idx_cloned_page_variants_active ON public.cloned_page_variants(is_active);

-- RLS Policies
ALTER TABLE public.cloned_page_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage variants for their pages"
  ON public.cloned_page_variants
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.cloned_pages
      WHERE cloned_pages.id = cloned_page_variants.page_id
      AND cloned_pages.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view active variants"
  ON public.cloned_page_variants
  FOR SELECT
  USING (is_active = true);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cloned_page_analytics_updated_at
  BEFORE UPDATE ON public.cloned_page_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cloned_page_leads_updated_at
  BEFORE UPDATE ON public.cloned_page_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cloned_page_variants_updated_at
  BEFORE UPDATE ON public.cloned_page_variants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();