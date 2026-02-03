-- Add business_id column to agent_customers table
ALTER TABLE public.agent_customers 
ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_agent_customers_business_id ON public.agent_customers(business_id);