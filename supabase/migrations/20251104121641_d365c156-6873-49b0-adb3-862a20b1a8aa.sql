-- Extensions (safe)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Briefing responses table
CREATE TABLE IF NOT EXISTS public.briefing_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  briefing_id UUID NOT NULL,
  visitor_name TEXT,
  visitor_email TEXT,
  visitor_phone TEXT,
  visitor_company TEXT,
  responses JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_briefing_responses_briefing_id ON public.briefing_responses(briefing_id);

-- Enable RLS
ALTER TABLE public.briefing_responses ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert responses
DROP POLICY IF EXISTS "Anyone can submit briefing responses" ON public.briefing_responses;
CREATE POLICY "Anyone can submit briefing responses"
ON public.briefing_responses
FOR INSERT
WITH CHECK (true);

-- Allow briefing owners to SELECT their responses
DROP POLICY IF EXISTS "Users can view responses to their briefings" ON public.briefing_responses;
CREATE POLICY "Users can view responses to their briefings"
ON public.briefing_responses
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.briefings
    WHERE briefings.id = briefing_responses.briefing_id
      AND briefings.user_id = auth.uid()
  )
);