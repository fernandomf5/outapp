ALTER TABLE public.contact_form_submissions
  ADD COLUMN IF NOT EXISTS agent_id uuid,
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS replied_at timestamptz,
  ADD COLUMN IF NOT EXISTS notes text;

CREATE INDEX IF NOT EXISTS idx_contact_form_submissions_agent ON public.contact_form_submissions(agent_id);
CREATE INDEX IF NOT EXISTS idx_contact_form_submissions_user ON public.contact_form_submissions(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_form_submissions TO authenticated;
GRANT INSERT ON public.contact_form_submissions TO anon;
GRANT ALL ON public.contact_form_submissions TO service_role;

DROP POLICY IF EXISTS "Owners can view their agent form submissions" ON public.contact_form_submissions;
CREATE POLICY "Owners can view their agent form submissions"
ON public.contact_form_submissions
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.ai_agents a
    WHERE a.id = contact_form_submissions.agent_id
      AND a.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Owners can update their agent form submissions" ON public.contact_form_submissions;
CREATE POLICY "Owners can update their agent form submissions"
ON public.contact_form_submissions
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.ai_agents a
    WHERE a.id = contact_form_submissions.agent_id
      AND a.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Owners can delete their agent form submissions" ON public.contact_form_submissions;
CREATE POLICY "Owners can delete their agent form submissions"
ON public.contact_form_submissions
FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.ai_agents a
    WHERE a.id = contact_form_submissions.agent_id
      AND a.user_id = auth.uid()
  )
);