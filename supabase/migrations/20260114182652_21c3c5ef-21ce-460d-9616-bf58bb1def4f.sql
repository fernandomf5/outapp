-- Create a separate table for task manager clients
CREATE TABLE public.task_clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.task_clients ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own task clients" 
ON public.task_clients 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own task clients" 
ON public.task_clients 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own task clients" 
ON public.task_clients 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own task clients" 
ON public.task_clients 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_task_clients_updated_at
BEFORE UPDATE ON public.task_clients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();