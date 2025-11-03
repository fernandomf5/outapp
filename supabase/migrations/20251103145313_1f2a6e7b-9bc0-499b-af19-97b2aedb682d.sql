-- Create saved_calculations table
CREATE TABLE IF NOT EXISTS public.saved_calculations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  expression TEXT NOT NULL,
  result TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.saved_calculations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own saved calculations"
  ON public.saved_calculations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own saved calculations"
  ON public.saved_calculations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved calculations"
  ON public.saved_calculations
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_saved_calculations_user_id ON public.saved_calculations(user_id);