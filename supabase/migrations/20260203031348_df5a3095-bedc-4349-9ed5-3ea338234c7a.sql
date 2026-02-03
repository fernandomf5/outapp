-- Add business_id column to contacts table
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_contacts_business_id ON public.contacts(business_id);