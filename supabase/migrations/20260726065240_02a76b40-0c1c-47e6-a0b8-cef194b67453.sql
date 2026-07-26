CREATE TABLE IF NOT EXISTS public.contact_resource_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  category_id uuid,
  resource_type text NOT NULL,
  resource_id uuid NOT NULL,
  resource_title text,
  resource_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_resource_links TO authenticated;
GRANT ALL ON public.contact_resource_links TO service_role;

ALTER TABLE public.contact_resource_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own contact resource links"
ON public.contact_resource_links
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE UNIQUE INDEX IF NOT EXISTS contact_resource_links_unique
  ON public.contact_resource_links (contact_id, resource_type, resource_id);

CREATE INDEX IF NOT EXISTS contact_resource_links_contact_idx
  ON public.contact_resource_links (contact_id, created_at DESC);

CREATE INDEX IF NOT EXISTS contact_resource_links_resource_idx
  ON public.contact_resource_links (resource_type, resource_id);

CREATE TRIGGER update_contact_resource_links_updated_at
BEFORE UPDATE ON public.contact_resource_links
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();