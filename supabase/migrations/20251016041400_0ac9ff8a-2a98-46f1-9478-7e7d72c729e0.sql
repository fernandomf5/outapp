-- Habilitar Realtime para a tabela chatbots
ALTER TABLE public.chatbots REPLICA IDENTITY FULL;

-- Adicionar tabela à publicação realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.chatbots;