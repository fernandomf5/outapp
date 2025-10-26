-- Adicionar campos de verificação de email
ALTER TABLE public.agent_customers 
ADD COLUMN email_verified boolean NOT NULL DEFAULT false,
ADD COLUMN verification_token text,
ADD COLUMN verification_token_expires_at timestamp with time zone;

ALTER TABLE public.chatbot_customers 
ADD COLUMN email_verified boolean NOT NULL DEFAULT false,
ADD COLUMN verification_token text,
ADD COLUMN verification_token_expires_at timestamp with time zone;

-- Criar índices para performance
CREATE INDEX idx_agent_customers_verification_token ON public.agent_customers(verification_token);
CREATE INDEX idx_chatbot_customers_verification_token ON public.chatbot_customers(verification_token);