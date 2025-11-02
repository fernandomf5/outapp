-- Adicionar colunas para sistema de fila e mensagem automática
ALTER TABLE public.chatbots 
ADD COLUMN IF NOT EXISTS enable_queue BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS auto_reply_message TEXT DEFAULT 'Olá! Envie sua mensagem que responderei assim que possível. 😊';