-- Drop existing restrictive or conflicting policies for task_blocks
DROP POLICY IF EXISTS "Users can manage their own task_blocks" ON public.task_blocks;
DROP POLICY IF EXISTS "Users can manage their own task blocks" ON public.task_blocks;
DROP POLICY IF EXISTS "Users can view their own task blocks" ON public.task_blocks;
DROP POLICY IF EXISTS "Users can create their own task blocks" ON public.task_blocks;
DROP POLICY IF EXISTS "Users can update their own task blocks" ON public.task_blocks;
DROP POLICY IF EXISTS "Users can delete their own task blocks" ON public.task_blocks;
DROP POLICY IF EXISTS "Team members can create delegated task blocks" ON public.task_blocks;
DROP POLICY IF EXISTS "Team members can read delegated task blocks" ON public.task_blocks;
DROP POLICY IF EXISTS "Team members can update delegated task blocks" ON public.task_blocks;
DROP POLICY IF EXISTS "Team members can delete delegated task blocks" ON public.task_blocks;

-- Create a single, clear policy for task_blocks (User's own blocks)
CREATE POLICY "Users can manage their own task blocks"
ON public.task_blocks
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Drop existing restrictive or conflicting policies for tasks
DROP POLICY IF EXISTS "Users can manage their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Team members can create delegated tasks" ON public.tasks;
DROP POLICY IF EXISTS "Team members can read delegated tasks" ON public.tasks;
DROP POLICY IF EXISTS "Team members can update delegated tasks" ON public.tasks;
DROP POLICY IF EXISTS "Team members can delete delegated tasks" ON public.tasks;

-- Create a single, clear policy for tasks (User's own tasks)
CREATE POLICY "Users can manage their own tasks"
ON public.tasks
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Ensure RLS is enabled
ALTER TABLE public.task_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Grant permissions (standard practice)
GRANT ALL ON public.task_blocks TO authenticated;
GRANT ALL ON public.tasks TO authenticated;
GRANT ALL ON public.task_blocks TO service_role;
GRANT ALL ON public.tasks TO service_role;
