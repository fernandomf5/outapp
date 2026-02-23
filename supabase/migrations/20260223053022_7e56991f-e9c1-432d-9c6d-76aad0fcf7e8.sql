
ALTER TABLE public.tutorial_videos ADD COLUMN IF NOT EXISTS feature_key TEXT;
CREATE INDEX IF NOT EXISTS idx_tutorial_videos_feature_key ON public.tutorial_videos(feature_key);
