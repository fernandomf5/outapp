
-- Add Aprova Job feature to features table
INSERT INTO public.features (name, description, key, category, is_active)
VALUES (
  'Aprova Job',
  'Sistema de aprovação de criativos para designers e agências',
  'aprova_job',
  'Gestão',
  true
)
ON CONFLICT (key) DO NOTHING;
