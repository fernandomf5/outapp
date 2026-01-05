-- Create table for builder pages
CREATE TABLE public.builder_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  elements JSONB NOT NULL DEFAULT '[]'::jsonb,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  thumbnail_url TEXT,
  views_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique index for slug per user
CREATE UNIQUE INDEX idx_builder_pages_user_slug ON public.builder_pages(user_id, slug);

-- Enable Row Level Security
ALTER TABLE public.builder_pages ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own pages" 
ON public.builder_pages 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own pages" 
ON public.builder_pages 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pages" 
ON public.builder_pages 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pages" 
ON public.builder_pages 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create policy for public viewing of published pages
CREATE POLICY "Anyone can view published pages" 
ON public.builder_pages 
FOR SELECT 
USING (is_published = true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_builder_pages_updated_at
BEFORE UPDATE ON public.builder_pages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();