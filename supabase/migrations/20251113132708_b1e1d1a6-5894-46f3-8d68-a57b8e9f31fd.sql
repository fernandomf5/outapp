-- Criar tabela para tokens de reset de senha do chatbot
CREATE TABLE IF NOT EXISTS public.chatbot_password_resets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.chatbot_customers(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar índices
CREATE INDEX idx_chatbot_password_resets_token ON public.chatbot_password_resets(token);
CREATE INDEX idx_chatbot_password_resets_customer_id ON public.chatbot_password_resets(customer_id);

-- Criar tabela para tokens de reset de senha do agente
CREATE TABLE IF NOT EXISTS public.agent_password_resets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.agent_customers(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar índices
CREATE INDEX idx_agent_password_resets_token ON public.agent_password_resets(token);
CREATE INDEX idx_agent_password_resets_customer_id ON public.agent_password_resets(customer_id);

-- Habilitar RLS
ALTER TABLE public.chatbot_password_resets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_password_resets ENABLE ROW LEVEL SECURITY;

-- Políticas (apenas acesso via service role)
CREATE POLICY "Service role full access on chatbot_password_resets"
  ON public.chatbot_password_resets
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access on agent_password_resets"
  ON public.agent_password_resets
  FOR ALL
  USING (true)
  WITH CHECK (true);