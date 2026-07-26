ALTER TABLE public.portfolios
  ADD COLUMN IF NOT EXISTS theme jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS sections jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS custom_fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS contact jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS layout text NOT NULL DEFAULT 'grid',
  ADD COLUMN IF NOT EXISTS template text NOT NULL DEFAULT 'custom',
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'custom',
  ADD COLUMN IF NOT EXISTS views integer NOT NULL DEFAULT 0;

ALTER TABLE public.portfolio_items
  ADD COLUMN IF NOT EXISTS custom_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS files jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS links jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS project_date date,
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT true;

DROP POLICY IF EXISTS "Público pode ver portfólio" ON public.portfolio_items;

CREATE TABLE IF NOT EXISTS public.portfolio_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id uuid NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  subject text,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.portfolio_messages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.portfolio_messages TO authenticated;
GRANT ALL ON public.portfolio_messages TO service_role;

ALTER TABLE public.portfolio_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can send a message to a public portfolio"
ON public.portfolio_messages FOR INSERT TO anon, authenticated
WITH CHECK (portfolio_id IN (SELECT id FROM public.portfolios WHERE is_public = true));

CREATE POLICY "Owners can view portfolio messages"
ON public.portfolio_messages FOR SELECT TO authenticated
USING (portfolio_id IN (SELECT id FROM public.portfolios WHERE user_id = auth.uid()));

CREATE POLICY "Owners can update portfolio messages"
ON public.portfolio_messages FOR UPDATE TO authenticated
USING (portfolio_id IN (SELECT id FROM public.portfolios WHERE user_id = auth.uid()));

CREATE POLICY "Owners can delete portfolio messages"
ON public.portfolio_messages FOR DELETE TO authenticated
USING (portfolio_id IN (SELECT id FROM public.portfolios WHERE user_id = auth.uid()));

CREATE TRIGGER update_portfolio_messages_updated_at
BEFORE UPDATE ON public.portfolio_messages
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.increment_portfolio_view(_portfolio_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.portfolios SET views = views + 1 WHERE id = _portfolio_id AND is_public = true;
$$;

GRANT EXECUTE ON FUNCTION public.increment_portfolio_view(uuid) TO anon, authenticated;

CREATE UNIQUE INDEX IF NOT EXISTS portfolios_slug_unique ON public.portfolios (slug) WHERE slug IS NOT NULL;