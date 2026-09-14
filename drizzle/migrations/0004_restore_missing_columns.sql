ALTER TABLE public.cloned_pages ADD COLUMN IF NOT EXISTS user_id UUID;
CREATE INDEX IF NOT EXISTS idx_cloned_pages_user_id ON public.cloned_pages(user_id);

ALTER TABLE public.ad_campaigns ADD COLUMN IF NOT EXISTS daily_budget NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE public.ad_campaigns ADD COLUMN IF NOT EXISTS creatives JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS client_signature_ip TEXT;