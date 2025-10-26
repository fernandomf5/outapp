-- Habilitar realtime para agent_messages
ALTER TABLE public.agent_messages REPLICA IDENTITY FULL;

-- Adicionar à publicação realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_messages;