-- Create task_blocks table for custom columns
CREATE TABLE IF NOT EXISTS public.task_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.task_blocks ENABLE ROW LEVEL SECURITY;

-- Policies for task_blocks
CREATE POLICY "Users can view their own task blocks"
  ON public.task_blocks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own task blocks"
  ON public.task_blocks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own task blocks"
  ON public.task_blocks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own task blocks"
  ON public.task_blocks FOR DELETE
  USING (auth.uid() = user_id);

-- Modify tasks table to use block_id instead of status
ALTER TABLE public.tasks 
  ADD COLUMN block_id UUID REFERENCES public.task_blocks(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX idx_task_blocks_user_id ON public.task_blocks(user_id);
CREATE INDEX idx_tasks_block_id ON public.tasks(block_id);

-- Create trigger for updated_at
CREATE TRIGGER update_task_blocks_updated_at
  BEFORE UPDATE ON public.task_blocks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();