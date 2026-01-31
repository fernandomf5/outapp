
-- Add video_downloader, media_converter, document_converter to all active plans
INSERT INTO public.plan_features (plan_id, feature_id)
SELECT p.id, f.id
FROM plans p
CROSS JOIN features f
WHERE p.is_active = true
AND f.key IN ('video_downloader', 'media_converter', 'document_converter')
ON CONFLICT DO NOTHING;
