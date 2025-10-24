-- Habilitar realtime para ticket_messages
ALTER TABLE public.ticket_messages REPLICA IDENTITY FULL;

-- Adicionar à publicação realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_messages;