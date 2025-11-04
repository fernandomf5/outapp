-- Criar tabela de briefings
CREATE TABLE IF NOT EXISTS public.briefings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  responses_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.briefings ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can manage their own briefings" ON public.briefings;

-- Políticas
CREATE POLICY "Users can manage their own briefings"
ON public.briefings
FOR ALL
USING (auth.uid() = user_id);

-- Criar tabela de respostas de briefings
CREATE TABLE IF NOT EXISTS public.briefing_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  briefing_id UUID NOT NULL REFERENCES public.briefings(id) ON DELETE CASCADE,
  responses JSONB NOT NULL DEFAULT '{}'::jsonb,
  visitor_name TEXT,
  visitor_email TEXT,
  visitor_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.briefing_responses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Briefing owners can view responses" ON public.briefing_responses;
DROP POLICY IF EXISTS "Public can create responses" ON public.briefing_responses;

-- Políticas para respostas
CREATE POLICY "Briefing owners can view responses"
ON public.briefing_responses
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.briefings
    WHERE briefings.id = briefing_responses.briefing_id
    AND briefings.user_id = auth.uid()
  )
);

CREATE POLICY "Public can create responses"
ON public.briefing_responses
FOR INSERT
WITH CHECK (true);

-- Adicionar responses_count à tabela quizzes se não existir
ALTER TABLE public.quizzes 
ADD COLUMN IF NOT EXISTS responses_count INTEGER NOT NULL DEFAULT 0;
