-- Criar tabela para perfis de link bio
CREATE TABLE public.link_bios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  theme TEXT DEFAULT 'default',
  background_color TEXT DEFAULT '#ffffff',
  text_color TEXT DEFAULT '#000000',
  button_color TEXT DEFAULT '#000000',
  button_text_color TEXT DEFAULT '#ffffff',
  custom_css TEXT,
  is_active BOOLEAN DEFAULT true,
  total_clicks INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para links individuais
CREATE TABLE public.link_bio_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bio_id UUID NOT NULL REFERENCES public.link_bios(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  icon TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  clicks INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para analytics de cliques
CREATE TABLE public.link_bio_clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bio_id UUID REFERENCES public.link_bios(id) ON DELETE CASCADE,
  link_id UUID REFERENCES public.link_bio_links(id) ON DELETE CASCADE,
  visitor_id TEXT,
  referrer TEXT,
  user_agent TEXT,
  country TEXT,
  device_type TEXT,
  clicked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.link_bios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.link_bio_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.link_bio_clicks ENABLE ROW LEVEL SECURITY;

-- Policies para link_bios
CREATE POLICY "Users can view their own bios" 
ON public.link_bios 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bios" 
ON public.link_bios 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bios" 
ON public.link_bios 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bios" 
ON public.link_bios 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view active bios by username" 
ON public.link_bios 
FOR SELECT 
USING (is_active = true);

-- Policies para link_bio_links
CREATE POLICY "Users can manage their own bio links" 
ON public.link_bio_links 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.link_bios 
    WHERE link_bios.id = link_bio_links.bio_id 
    AND link_bios.user_id = auth.uid()
  )
);

CREATE POLICY "Anyone can view active links from active bios" 
ON public.link_bio_links 
FOR SELECT 
USING (
  is_active = true AND
  EXISTS (
    SELECT 1 FROM public.link_bios 
    WHERE link_bios.id = link_bio_links.bio_id 
    AND link_bios.is_active = true
  )
);

-- Policies para link_bio_clicks
CREATE POLICY "Users can view their own bio clicks" 
ON public.link_bio_clicks 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.link_bios 
    WHERE link_bios.id = link_bio_clicks.bio_id 
    AND link_bios.user_id = auth.uid()
  )
);

CREATE POLICY "Anyone can insert clicks" 
ON public.link_bio_clicks 
FOR INSERT 
WITH CHECK (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_link_bios_updated_at
BEFORE UPDATE ON public.link_bios
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_link_bio_links_updated_at
BEFORE UPDATE ON public.link_bio_links
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function para incrementar cliques totais
CREATE OR REPLACE FUNCTION public.increment_bio_clicks()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Incrementar contador do link específico
  IF NEW.link_id IS NOT NULL THEN
    UPDATE link_bio_links
    SET clicks = clicks + 1
    WHERE id = NEW.link_id;
  END IF;
  
  -- Incrementar contador total do bio
  UPDATE link_bios
  SET total_clicks = total_clicks + 1
  WHERE id = NEW.bio_id;
  
  RETURN NEW;
END;
$$;

-- Trigger para incrementar cliques
CREATE TRIGGER increment_bio_clicks_trigger
AFTER INSERT ON public.link_bio_clicks
FOR EACH ROW
EXECUTE FUNCTION public.increment_bio_clicks();

-- Criar índices para performance
CREATE INDEX idx_link_bios_username ON public.link_bios(username);
CREATE INDEX idx_link_bios_user_id ON public.link_bios(user_id);
CREATE INDEX idx_link_bio_links_bio_id ON public.link_bio_links(bio_id);
CREATE INDEX idx_link_bio_links_position ON public.link_bio_links(bio_id, position);
CREATE INDEX idx_link_bio_clicks_bio_id ON public.link_bio_clicks(bio_id);
CREATE INDEX idx_link_bio_clicks_link_id ON public.link_bio_clicks(link_id);