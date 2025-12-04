
-- Associate ai_agent feature with all plans
INSERT INTO plan_features (plan_id, feature_id)
SELECT p.id, f.id
FROM plans p, features f
WHERE f.key = 'ai_agent'
ON CONFLICT DO NOTHING;
