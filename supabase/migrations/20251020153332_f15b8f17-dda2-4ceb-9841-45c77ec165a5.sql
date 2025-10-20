-- Criar tabela de funis de vendas
CREATE TABLE IF NOT EXISTS public.funnels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  config JSONB DEFAULT '{"nodes": [], "edges": []}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.funnels ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Usuários podem ver seus próprios funis"
ON public.funnels FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seus próprios funis"
ON public.funnels FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios funis"
ON public.funnels FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios funis"
ON public.funnels FOR DELETE
USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_funnels_updated_at
BEFORE UPDATE ON public.funnels
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();