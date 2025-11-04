-- Create websites table
CREATE TABLE IF NOT EXISTS public.websites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  template TEXT NOT NULL DEFAULT 'landing',
  custom_domain TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  sections JSONB DEFAULT '[]'::jsonb,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.websites ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own websites"
ON public.websites
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Update trigger
CREATE TRIGGER websites_updated_at
BEFORE UPDATE ON public.websites
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();