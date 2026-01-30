-- Adicionar recursos de conversores na tabela features
INSERT INTO features (name, key, category, is_active) VALUES
  ('Conversor de Mídia', 'media_converter', 'Ferramentas', true),
  ('Conversor de Documentos', 'document_converter', 'Ferramentas', true)
ON CONFLICT (key) DO NOTHING;