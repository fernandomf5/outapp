-- Drop the task_clients table and create a linking table instead
DROP TABLE IF EXISTS public.task_clients;

-- Create a linking table to connect users with existing customers for task management
CREATE TABLE public.task_client_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, customer_id)
);

-- Enable Row Level Security
ALTER TABLE public.task_client_links ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own task client links" 
ON public.task_client_links 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own task client links" 
ON public.task_client_links 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own task client links" 
ON public.task_client_links 
FOR DELETE 
USING (auth.uid() = user_id);