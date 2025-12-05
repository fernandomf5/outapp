-- Add aprova_job feature to all plans
INSERT INTO public.plan_features (plan_id, feature_id)
SELECT p.id, f.id
FROM public.plans p
CROSS JOIN public.features f
WHERE f.key = 'aprova_job'
ON CONFLICT DO NOTHING;