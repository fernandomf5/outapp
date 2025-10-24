-- Garantir que ticket_messages tem REPLICA IDENTITY FULL para realtime completo
ALTER TABLE public.ticket_messages REPLICA IDENTITY FULL;