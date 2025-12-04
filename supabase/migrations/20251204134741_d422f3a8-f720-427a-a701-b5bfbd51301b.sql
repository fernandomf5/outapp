
-- Remove features that no longer exist in the platform
DELETE FROM features WHERE key IN (
  'ai_agent', 
  'chatbot_web', 
  'chatbot_conversations', 
  'tracking_pixels', 
  'domain_manager'
);

-- Insert new features that were recently created
INSERT INTO features (name, key, description, category, is_active) VALUES
  ('Chat Online', 'chat_online', 'Sistema de chat online com atendentes', 'Automação', true),
  ('Agenda', 'agenda', 'Sistema de agenda pessoal com lembretes', 'management', true),
  ('Gestão de Clientes', 'clients_management', 'Gerenciamento de clientes', 'management', true),
  ('Botão Flutuante Multi-Links', 'floating_button', 'Gerador de botão flutuante multi-links', 'tools', true),
  ('Criador de Mapa Mental', 'mind_map_creator', 'Criador de mapas mentais interativos', 'productivity', true),
  ('Criador de Propostas', 'proposal_creator', 'Criador de propostas comerciais', 'productivity', true),
  ('CRM Geral', 'crm_general', 'Sistema CRM completo', 'CRM', true)
ON CONFLICT (key) DO NOTHING;
