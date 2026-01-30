-- Adicionar recurso Video Downloader na tabela features
INSERT INTO features (name, key, category, is_active) VALUES
  ('Video Downloader', 'video_downloader', 'Ferramentas', true)
ON CONFLICT (key) DO NOTHING;