
-- Remove the duplicate chat_online feature I created
DELETE FROM features WHERE key = 'chat_online';

-- Re-add ai_agent but with the correct name "Chat Online"
INSERT INTO features (name, key, description, category, is_active) VALUES
  ('Chat Online', 'ai_agent', 'Sistema de chat online com atendentes', 'Automação', true)
ON CONFLICT (key) DO UPDATE SET name = 'Chat Online', description = 'Sistema de chat online com atendentes';
