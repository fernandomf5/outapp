-- Table for customer services history
CREATE TABLE public.customer_services_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  service_id UUID REFERENCES public.user_services(id) ON DELETE SET NULL,
  service_name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) DEFAULT 0,
  service_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT DEFAULT 'completed' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for customer purchases history
CREATE TABLE public.customer_purchases_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) DEFAULT 0,
  total_price DECIMAL(10,2) DEFAULT 0,
  purchase_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for customer payments history
CREATE TABLE public.customer_payments_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'pix', 'credit_card', 'debit_card', 'bank_transfer', 'boleto', 'other')),
  payment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reference_type TEXT CHECK (reference_type IN ('service', 'purchase', 'other')),
  reference_id UUID,
  description TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customer_services_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_purchases_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_payments_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customer_services_history
CREATE POLICY "Users can view their own customer services history"
ON public.customer_services_history FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create customer services history"
ON public.customer_services_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own customer services history"
ON public.customer_services_history FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own customer services history"
ON public.customer_services_history FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for customer_purchases_history
CREATE POLICY "Users can view their own customer purchases history"
ON public.customer_purchases_history FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create customer purchases history"
ON public.customer_purchases_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own customer purchases history"
ON public.customer_purchases_history FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own customer purchases history"
ON public.customer_purchases_history FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for customer_payments_history
CREATE POLICY "Users can view their own customer payments history"
ON public.customer_payments_history FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create customer payments history"
ON public.customer_payments_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own customer payments history"
ON public.customer_payments_history FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own customer payments history"
ON public.customer_payments_history FOR DELETE
USING (auth.uid() = user_id);

-- Indexes for better performance
CREATE INDEX idx_customer_services_contact ON public.customer_services_history(contact_id);
CREATE INDEX idx_customer_services_user ON public.customer_services_history(user_id);
CREATE INDEX idx_customer_purchases_contact ON public.customer_purchases_history(contact_id);
CREATE INDEX idx_customer_purchases_user ON public.customer_purchases_history(user_id);
CREATE INDEX idx_customer_payments_contact ON public.customer_payments_history(contact_id);
CREATE INDEX idx_customer_payments_user ON public.customer_payments_history(user_id);