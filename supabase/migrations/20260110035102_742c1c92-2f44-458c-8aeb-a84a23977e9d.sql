-- Create table for customer categories
CREATE TABLE public.customer_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customer_categories ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own categories" 
ON public.customer_categories 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own categories" 
ON public.customer_categories 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories" 
ON public.customer_categories 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories" 
ON public.customer_categories 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add category_id column to customers table
ALTER TABLE public.customers 
ADD COLUMN category_id UUID REFERENCES public.customer_categories(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX idx_customers_category_id ON public.customers(category_id);
CREATE INDEX idx_customer_categories_user_id ON public.customer_categories(user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_customer_categories_updated_at
BEFORE UPDATE ON public.customer_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();