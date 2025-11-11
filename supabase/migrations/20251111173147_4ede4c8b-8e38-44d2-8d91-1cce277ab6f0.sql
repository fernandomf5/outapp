-- Criar tabela de clientes de anúncios
CREATE TABLE IF NOT EXISTS public.ad_clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  client_type TEXT NOT NULL DEFAULT 'personal' CHECK (client_type IN ('personal', 'company')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ad_clients ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own ad clients"
  ON public.ad_clients
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own ad clients"
  ON public.ad_clients
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ad clients"
  ON public.ad_clients
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ad clients"
  ON public.ad_clients
  FOR DELETE
  USING (auth.uid() = user_id);

-- Adicionar client_id à tabela de campanhas
ALTER TABLE public.ad_campaigns
  ADD COLUMN client_id UUID REFERENCES public.ad_clients(id) ON DELETE CASCADE;

-- Remover a coluna antiga client_name (será substituída pela relação)
ALTER TABLE public.ad_campaigns
  DROP COLUMN IF EXISTS client_name;

-- Criar índice para melhor performance
CREATE INDEX idx_ad_campaigns_client_id ON public.ad_campaigns(client_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_ad_clients_updated_at
  BEFORE UPDATE ON public.ad_clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();