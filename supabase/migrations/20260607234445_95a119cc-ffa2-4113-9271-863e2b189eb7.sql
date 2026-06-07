ALTER TABLE public.task_blocks ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS avatar_url TEXT;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_blocks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_members TO authenticated;
GRANT ALL ON public.task_blocks TO service_role;
GRANT ALL ON public.team_members TO service_role;