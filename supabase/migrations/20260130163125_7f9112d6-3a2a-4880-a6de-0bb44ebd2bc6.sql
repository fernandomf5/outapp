-- Adicionar recursos que estão faltando na tabela features
INSERT INTO features (name, key, category, is_active) VALUES
  ('Extrator de Criativos', 'creative_extractor', 'Marketing', true),
  ('Chatbot/Chat Online Web', 'chatbot', 'Comunicação', true),
  ('Gerador de Widget Chat', 'chat_widget', 'Comunicação', true),
  ('Pixels Manager', 'pixels_manager', 'Marketing', true),
  ('Texto para Voz (TTS)', 'text_to_speech', 'Ferramentas', true),
  ('Calculadora Online', 'calculator', 'Ferramentas', true),
  ('Leads Capturados', 'captured_leads', 'CRM', true),
  ('Produtos Digitais', 'digital_product_creator', 'Vendas', true),
  ('Ad Spy', 'ad_spy', 'Marketing', true),
  ('Notas Rápidas', 'quick_notes', 'productivity', true),
  ('Gerador de Capa de Vídeo', 'video_cover', 'Ferramentas', true),
  ('Gerador de Thumbnail', 'video_thumbnail', 'Ferramentas', true)
ON CONFLICT (key) DO NOTHING;