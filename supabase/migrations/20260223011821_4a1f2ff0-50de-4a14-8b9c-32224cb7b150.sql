
-- Create routines table to hold named routines
CREATE TABLE public.routines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own routines" ON public.routines FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own routines" ON public.routines FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own routines" ON public.routines FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own routines" ON public.routines FOR DELETE USING (auth.uid() = user_id);

-- Add routine_id to routine_items (nullable for backward compat)
ALTER TABLE public.routine_items ADD COLUMN routine_id UUID REFERENCES public.routines(id) ON DELETE CASCADE;

-- Add routine_id to routine_objectives too
ALTER TABLE public.routine_objectives ADD COLUMN routine_id UUID REFERENCES public.routines(id) ON DELETE CASCADE;
