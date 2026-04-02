CREATE TABLE public.customer_contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  file_name TEXT,
  contract_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own contracts"
ON public.customer_contracts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own contracts"
ON public.customer_contracts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contracts"
ON public.customer_contracts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contracts"
ON public.customer_contracts FOR DELETE
USING (auth.uid() = user_id);

CREATE TRIGGER update_customer_contracts_updated_at
BEFORE UPDATE ON public.customer_contracts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();