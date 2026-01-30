-- Add business_id to products table
ALTER TABLE public.products ADD COLUMN business_id uuid REFERENCES public.businesses(id) ON DELETE SET NULL;

-- Add business_id to user_services table  
ALTER TABLE public.user_services ADD COLUMN business_id uuid REFERENCES public.businesses(id) ON DELETE SET NULL;

-- Create indexes for better query performance
CREATE INDEX idx_products_business_id ON public.products(business_id);
CREATE INDEX idx_user_services_business_id ON public.user_services(business_id);