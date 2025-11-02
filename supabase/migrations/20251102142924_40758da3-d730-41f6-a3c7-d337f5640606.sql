-- Tabela para armazenar códigos de verificação de e-mail
CREATE TABLE IF NOT EXISTS public.chatbot_customer_verification_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.chatbot_customers(id) ON DELETE CASCADE,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar campo email_verified na tabela chatbot_customers
ALTER TABLE public.chatbot_customers 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false;

-- Índice para melhorar performance nas buscas
CREATE INDEX IF NOT EXISTS idx_verification_codes_customer_id 
ON public.chatbot_customer_verification_codes(customer_id);

CREATE INDEX IF NOT EXISTS idx_verification_codes_code 
ON public.chatbot_customer_verification_codes(code);

-- Política RLS para a tabela de códigos de verificação
ALTER TABLE public.chatbot_customer_verification_codes ENABLE ROW LEVEL SECURITY;

-- Políticas para permitir acesso aos próprios códigos
CREATE POLICY "Users can view their own verification codes"
ON public.chatbot_customer_verification_codes
FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own verification codes"
ON public.chatbot_customer_verification_codes
FOR INSERT
WITH CHECK (true);