-- Adicionar feature portfolio_creator a todos os planos ativos
INSERT INTO plan_features (plan_id, feature_id)
SELECT p.id, '68796efb-37b3-4c2c-b3d3-f7c96e85a59a'
FROM plans p
WHERE p.is_active = true
ON CONFLICT DO NOTHING;