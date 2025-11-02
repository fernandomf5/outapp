-- Adicionar coluna enable_auto_reply na tabela chatbots
ALTER TABLE public.chatbots 
ADD COLUMN IF NOT EXISTS enable_auto_reply BOOLEAN DEFAULT true;