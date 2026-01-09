-- Adicionar o recurso "Disparador Manual" na tabela de features
INSERT INTO public.features (name, description, key, category, is_active)
VALUES (
  'Disparador Manual',
  'Permite cadastrar leads e abrir conversas no WhatsApp Web com mensagens personalizadas',
  'disparador_manual',
  'Marketing',
  true
)
ON CONFLICT (key) DO NOTHING;