-- Adicionar campo sender_name nas tabelas de mensagens
ALTER TABLE chatbot_messages ADD COLUMN IF NOT EXISTS sender_name TEXT;
ALTER TABLE agent_messages ADD COLUMN IF NOT EXISTS sender_name TEXT;