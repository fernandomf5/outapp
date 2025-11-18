-- Create financial_categories table
CREATE TABLE IF NOT EXISTS public.financial_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  business_id UUID REFERENCES public.financial_businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.financial_categories ENABLE ROW LEVEL SECURITY;

-- Policies for financial_categories
CREATE POLICY "Users can manage their own categories"
ON public.financial_categories
FOR ALL
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_financial_categories_business_id ON public.financial_categories(business_id);
CREATE INDEX idx_financial_categories_user_id ON public.financial_categories(user_id);