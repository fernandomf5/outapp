-- Create portfolios table (main portfolio container)
CREATE TABLE IF NOT EXISTS public.portfolios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  niche TEXT NOT NULL DEFAULT 'general',
  primary_color TEXT DEFAULT '#8B5CF6',
  secondary_color TEXT DEFAULT '#0EA5E9',
  logo_url TEXT,
  cover_url TEXT,
  is_active BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT true,
  slug TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add portfolio_id to existing portfolio_items if not exists
ALTER TABLE public.portfolio_items 
ADD COLUMN IF NOT EXISTS portfolio_id UUID REFERENCES public.portfolios(id) ON DELETE CASCADE;

-- Add client_name if not exists
ALTER TABLE public.portfolio_items 
ADD COLUMN IF NOT EXISTS client_name TEXT;

-- Add video_url if not exists
ALTER TABLE public.portfolio_items 
ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Enable Row Level Security
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own portfolios" ON public.portfolios;
DROP POLICY IF EXISTS "Public can view public portfolios" ON public.portfolios;
DROP POLICY IF EXISTS "Users can create their own portfolios" ON public.portfolios;
DROP POLICY IF EXISTS "Users can update their own portfolios" ON public.portfolios;
DROP POLICY IF EXISTS "Users can delete their own portfolios" ON public.portfolios;

-- Create policies for portfolios
CREATE POLICY "Users can view their own portfolios" 
ON public.portfolios 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Public can view public portfolios"
ON public.portfolios
FOR SELECT
USING (is_public = true);

CREATE POLICY "Users can create their own portfolios" 
ON public.portfolios 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own portfolios" 
ON public.portfolios 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own portfolios" 
ON public.portfolios 
FOR DELETE 
USING (auth.uid() = user_id);

-- Enable RLS on portfolio_items if not already
ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own portfolio items" ON public.portfolio_items;
DROP POLICY IF EXISTS "Public can view items from public portfolios" ON public.portfolio_items;
DROP POLICY IF EXISTS "Users can create their own portfolio items" ON public.portfolio_items;
DROP POLICY IF EXISTS "Users can update their own portfolio items" ON public.portfolio_items;
DROP POLICY IF EXISTS "Users can delete their own portfolio items" ON public.portfolio_items;

-- Create policies for portfolio_items
CREATE POLICY "Users can view their own portfolio items" 
ON public.portfolio_items 
FOR SELECT 
USING (
  portfolio_id IN (
    SELECT id FROM public.portfolios WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Public can view items from public portfolios"
ON public.portfolio_items
FOR SELECT
USING (
  portfolio_id IN (
    SELECT id FROM public.portfolios WHERE is_public = true
  )
);

CREATE POLICY "Users can create their own portfolio items" 
ON public.portfolio_items 
FOR INSERT 
WITH CHECK (
  portfolio_id IN (
    SELECT id FROM public.portfolios WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own portfolio items" 
ON public.portfolio_items 
FOR UPDATE 
USING (
  portfolio_id IN (
    SELECT id FROM public.portfolios WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own portfolio items" 
ON public.portfolio_items 
FOR DELETE 
USING (
  portfolio_id IN (
    SELECT id FROM public.portfolios WHERE user_id = auth.uid()
  )
);

-- Create trigger for automatic timestamp updates
DROP TRIGGER IF EXISTS update_portfolios_updated_at ON public.portfolios;
CREATE TRIGGER update_portfolios_updated_at
BEFORE UPDATE ON public.portfolios
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON public.portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_items_portfolio_id ON public.portfolio_items(portfolio_id);