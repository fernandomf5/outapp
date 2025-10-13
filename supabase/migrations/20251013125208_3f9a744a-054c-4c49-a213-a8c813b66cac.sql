-- Adicionar política RLS para permitir que usuários deletem suas próprias mensagens
CREATE POLICY "Users can delete their own messages"
ON public.admin_messages
FOR DELETE
USING (auth.uid() = user_id);

-- Adicionar política RLS para permitir que admins deletem mensagens
CREATE POLICY "Admins can delete all messages"
ON public.admin_messages
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Criar tabela de integrações de pagamento
CREATE TABLE public.payment_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  platform TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  api_key TEXT,
  api_secret TEXT,
  webhook_url TEXT,
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.payment_integrations ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem gerenciar integrações
CREATE POLICY "Admins can manage payment integrations"
ON public.payment_integrations
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_payment_integrations_updated_at
BEFORE UPDATE ON public.payment_integrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();