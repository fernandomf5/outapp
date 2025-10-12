-- Tabela para páginas customizadas
CREATE TABLE public.custom_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  location TEXT NOT NULL CHECK (location IN ('header', 'footer')),
  open_as_popup BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.custom_pages ENABLE ROW LEVEL SECURITY;

-- Políticas para páginas customizadas
CREATE POLICY "Anyone can view active pages"
ON public.custom_pages
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage custom pages"
ON public.custom_pages
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Tabela para configurações do site
CREATE TABLE public.site_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Políticas para configurações
CREATE POLICY "Anyone can view site settings"
ON public.site_settings
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage site settings"
ON public.site_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Inserir configuração inicial para vídeo
INSERT INTO public.site_settings (key, value, description)
VALUES ('landing_video_url', '', 'URL do vídeo da landing page (YouTube, Vimeo, etc.)');

-- Trigger para atualizar updated_at nas páginas
CREATE TRIGGER update_custom_pages_updated_at
BEFORE UPDATE ON public.custom_pages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para atualizar updated_at nas configurações
CREATE TRIGGER update_site_settings_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();