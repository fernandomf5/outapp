
CREATE TABLE IF NOT EXISTS public.contact_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'in_progress',
  attachments JSONB DEFAULT '[]'::jsonb,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_history TO authenticated;
GRANT SELECT ON public.contact_history TO anon;
GRANT ALL ON public.contact_history TO service_role;

ALTER TABLE public.contact_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their contact history"
  ON public.contact_history FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can view public contact history"
  ON public.contact_history FOR SELECT
  USING (is_public = true);

CREATE INDEX IF NOT EXISTS idx_contact_history_contact ON public.contact_history(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_history_user ON public.contact_history(user_id);

CREATE TRIGGER update_contact_history_updated_at
  BEFORE UPDATE ON public.contact_history
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
