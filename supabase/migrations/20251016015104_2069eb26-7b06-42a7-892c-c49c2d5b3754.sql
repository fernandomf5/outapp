-- Habilitar realtime para chatbot_messages e chatbot_conversations
ALTER PUBLICATION supabase_realtime ADD TABLE chatbot_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE chatbot_conversations;