-- Adicionar campo user_name na tabela tickets
ALTER TABLE public.tickets
ADD COLUMN user_name TEXT;

-- Adicionar campo agent_name na tabela ticket_messages
ALTER TABLE public.ticket_messages
ADD COLUMN agent_name TEXT;