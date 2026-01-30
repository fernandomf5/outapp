-- Add customer/business linking columns to members_areas
ALTER TABLE public.members_areas 
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_members_areas_customer_id ON public.members_areas(customer_id);
CREATE INDEX IF NOT EXISTS idx_members_areas_business_id ON public.members_areas(business_id);

-- Add customer_id to simple_members_areas as well
ALTER TABLE public.simple_members_areas 
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_simple_members_areas_customer_id ON public.simple_members_areas(customer_id);
CREATE INDEX IF NOT EXISTS idx_simple_members_areas_business_id ON public.simple_members_areas(business_id);