-- Inserir features faltantes
INSERT INTO features (name, key, description, category, is_active) VALUES
  ('Link na Bio', 'link_bio', 'Criador de página Link na Bio personalizada', 'tools', true),
  ('Gerador QR Code', 'qrcode_generator', 'Gerador de QR Codes personalizados', 'tools', true),
  ('Gestão Financeira', 'financial_management', 'Painel de gestão financeira completo', 'management', true),
  ('Gestão de Equipe', 'team_management', 'Gerenciamento de equipes e membros', 'management', true),
  ('Gestão de Anúncios', 'ads_management', 'Gerenciador de anúncios e campanhas', 'marketing', true),
  ('Criador de Popups', 'popup_creator', 'Criador de popups personalizados', 'marketing', true),
  ('Organizador de Tarefas', 'task_organizer', 'Sistema de organização de tarefas', 'productivity', true),
  ('Criador de Quiz', 'quiz_creator', 'Criador de quizzes interativos', 'engagement', true),
  ('Área de Membros', 'members_area', 'Criador de área de membros e cursos', 'content', true),
  ('Criador de Briefing', 'briefing_creator', 'Sistema de criação e gestão de briefings', 'content', true),
  ('Gerenciador de Domínios', 'domain_manager', 'Gestão de domínios personalizados', 'tools', true),
  ('Criador de Sites', 'website_builder', 'Construtor de sites completo', 'content', true)
ON CONFLICT (key) DO NOTHING;

-- Associar todas as features ao plano Trial Gratuito
INSERT INTO plan_features (plan_id, feature_id)
SELECT 
  p.id,
  f.id
FROM plans p
CROSS JOIN features f
WHERE p.plan_type = 'free_trial'
  AND f.key IN (
    'link_bio',
    'qrcode_generator', 
    'financial_management',
    'team_management',
    'ads_management',
    'popup_creator',
    'task_organizer',
    'quiz_creator',
    'members_area',
    'briefing_creator',
    'domain_manager',
    'website_builder'
  )
ON CONFLICT (plan_id, feature_id) DO NOTHING;