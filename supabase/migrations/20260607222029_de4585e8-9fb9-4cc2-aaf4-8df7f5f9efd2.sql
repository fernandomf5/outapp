-- Grant access to authenticated users
GRANT ALL ON public.task_blocks TO authenticated;
GRANT ALL ON public.tasks TO authenticated;
GRANT ALL ON public.task_blocks TO service_role;
GRANT ALL ON public.tasks TO service_role;

-- Enable RLS
ALTER TABLE public.task_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Recreate policies for task_blocks
DROP POLICY IF EXISTS "Users can manage their own task blocks" ON public.task_blocks;
CREATE POLICY "Users can manage their own task blocks" ON public.task_blocks
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Recreate policies for tasks
DROP POLICY IF EXISTS "Users can manage their own tasks" ON public.tasks;
CREATE POLICY "Users can manage their own tasks" ON public.tasks
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);