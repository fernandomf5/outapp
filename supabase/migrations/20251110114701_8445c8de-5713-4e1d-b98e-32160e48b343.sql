-- Associar TODAS as features aos planos Mensal e Anual
INSERT INTO plan_features (plan_id, feature_id)
SELECT 
  p.id,
  f.id
FROM plans p
CROSS JOIN features f
WHERE p.plan_type IN ('monthly', 'annual', 'lifetime')
  AND f.is_active = true
ON CONFLICT (plan_id, feature_id) DO NOTHING;