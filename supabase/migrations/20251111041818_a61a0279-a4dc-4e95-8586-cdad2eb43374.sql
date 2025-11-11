-- Tabela para solicitações de acesso à área de membros
CREATE TABLE IF NOT EXISTS public.members_area_access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id UUID NOT NULL REFERENCES public.members_areas(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  UNIQUE(area_id, email)
);

-- Tabela para conteúdos dentro de módulos (múltiplos conteúdos por módulo)
CREATE TABLE IF NOT EXISTS public.members_area_module_contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES public.members_area_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('video', 'document', 'text')),
  video_url TEXT,
  document_url TEXT,
  content_data TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  duration TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_access_requests_area ON public.members_area_access_requests(area_id);
CREATE INDEX IF NOT EXISTS idx_access_requests_status ON public.members_area_access_requests(status);
CREATE INDEX IF NOT EXISTS idx_module_contents_module ON public.members_area_module_contents(module_id);

-- RLS Policies para access_requests
ALTER TABLE public.members_area_access_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem criar solicitações"
ON public.members_area_access_requests
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Donos podem ver solicitações de suas áreas"
ON public.members_area_access_requests
FOR SELECT
TO authenticated
USING (
  area_id IN (
    SELECT id FROM public.members_areas WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Donos podem atualizar solicitações de suas áreas"
ON public.members_area_access_requests
FOR UPDATE
TO authenticated
USING (
  area_id IN (
    SELECT id FROM public.members_areas WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Donos podem deletar solicitações de suas áreas"
ON public.members_area_access_requests
FOR DELETE
TO authenticated
USING (
  area_id IN (
    SELECT id FROM public.members_areas WHERE user_id = auth.uid()
  )
);

-- RLS Policies para module_contents
ALTER TABLE public.members_area_module_contents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Donos podem gerenciar conteúdos de seus módulos"
ON public.members_area_module_contents
FOR ALL
TO authenticated
USING (
  module_id IN (
    SELECT m.id FROM public.members_area_modules m
    JOIN public.members_areas ma ON m.members_area_id = ma.id
    WHERE ma.user_id = auth.uid()
  )
);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_module_contents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_module_contents_updated_at
BEFORE UPDATE ON public.members_area_module_contents
FOR EACH ROW
EXECUTE FUNCTION update_module_contents_updated_at();