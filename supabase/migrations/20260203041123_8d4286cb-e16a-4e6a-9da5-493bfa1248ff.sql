-- Add business_id column to customers table
ALTER TABLE public.customers 
ADD COLUMN business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX idx_customers_business_id ON public.customers(business_id);