-- Create catalogs table for storing user catalogs
CREATE TABLE public.catalogs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT,
  logo_url TEXT,
  cover_url TEXT,
  primary_color VARCHAR(20) DEFAULT '#3b82f6',
  whatsapp_number VARCHAR(20),
  show_prices BOOLEAN DEFAULT true,
  show_stock BOOLEAN DEFAULT false,
  show_description BOOLEAN DEFAULT true,
  layout_style VARCHAR(20) DEFAULT 'grid',
  is_active BOOLEAN DEFAULT true,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create unique index on slug
CREATE UNIQUE INDEX catalogs_slug_unique ON public.catalogs(slug);

-- Enable RLS
ALTER TABLE public.catalogs ENABLE ROW LEVEL SECURITY;

-- Policy for users to manage their own catalogs
CREATE POLICY "Users can manage their own catalogs"
  ON public.catalogs
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy for public view of active catalogs
CREATE POLICY "Anyone can view active catalogs"
  ON public.catalogs
  FOR SELECT
  USING (is_active = true);

-- Add trigger for updated_at
CREATE TRIGGER update_catalogs_updated_at
  BEFORE UPDATE ON public.catalogs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();