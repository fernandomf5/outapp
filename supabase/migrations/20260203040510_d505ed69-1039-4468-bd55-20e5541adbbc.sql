-- Add business_id column to chatbot_customers table
ALTER TABLE public.chatbot_customers 
ADD COLUMN business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX idx_chatbot_customers_business_id ON public.chatbot_customers(business_id);