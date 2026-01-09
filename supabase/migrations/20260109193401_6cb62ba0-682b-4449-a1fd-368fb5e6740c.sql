-- Create table for saved manual dispatcher lists
CREATE TABLE public.manual_dispatcher_lists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  leads JSONB NOT NULL DEFAULT '[]'::jsonb,
  message TEXT,
  total_leads INTEGER NOT NULL DEFAULT 0,
  sent_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.manual_dispatcher_lists ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own lists" 
ON public.manual_dispatcher_lists 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own lists" 
ON public.manual_dispatcher_lists 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lists" 
ON public.manual_dispatcher_lists 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lists" 
ON public.manual_dispatcher_lists 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_manual_dispatcher_lists_updated_at
BEFORE UPDATE ON public.manual_dispatcher_lists
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();