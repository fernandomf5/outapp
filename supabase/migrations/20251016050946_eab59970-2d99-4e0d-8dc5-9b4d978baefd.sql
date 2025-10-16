-- Criar tabela de links encurtados
CREATE TABLE public.short_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  original_url TEXT NOT NULL,
  short_code TEXT NOT NULL UNIQUE,
  custom_name TEXT,
  clicks INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.short_links ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own short links"
  ON public.short_links FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own short links"
  ON public.short_links FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own short links"
  ON public.short_links FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own short links"
  ON public.short_links FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Public can view active short links by code"
  ON public.short_links FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can view all short links"
  ON public.short_links FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Índices
CREATE INDEX idx_short_links_user_id ON public.short_links(user_id);
CREATE INDEX idx_short_links_short_code ON public.short_links(short_code);
CREATE INDEX idx_short_links_created_at ON public.short_links(created_at DESC);