-- Create task_business_links table to link businesses to task organizer
CREATE TABLE public.task_business_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, business_id)
);

-- Enable RLS
ALTER TABLE public.task_business_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own task business links"
  ON public.task_business_links
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own task business links"
  ON public.task_business_links
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own task business links"
  ON public.task_business_links
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add business_id column to tasks table
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL;

-- Add business_id column to task_blocks table  
ALTER TABLE public.task_blocks ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL;