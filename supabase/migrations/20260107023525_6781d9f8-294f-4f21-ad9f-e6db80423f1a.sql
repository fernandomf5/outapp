-- Inserir o recurso page_builder se não existir
INSERT INTO public.features (name, description, key, category, is_active)
VALUES (
  'Criador de Páginas',
  'Crie landing pages profissionais com drag & drop',
  'page_builder',
  'Marketing',
  true
) ON CONFLICT (key) DO NOTHING;