
ALTER TABLE public.agent_messages ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
GRANT ALL ON public.agent_messages TO authenticated;
GRANT ALL ON public.agent_messages TO service_role;
GRANT SELECT, INSERT ON public.agent_messages TO anon;
