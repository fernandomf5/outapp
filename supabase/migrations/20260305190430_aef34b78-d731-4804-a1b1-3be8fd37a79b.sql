
-- Planos recorrentes de faturamento
CREATE TABLE public.invoice_recurring_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  plan_name TEXT NOT NULL,
  description TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  recurrence_type TEXT NOT NULL DEFAULT 'monthly',
  next_invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  pix_key TEXT,
  pix_key_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.invoice_recurring_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own recurring plans"
  ON public.invoice_recurring_plans FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Faturas
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  recurring_plan_id UUID REFERENCES public.invoice_recurring_plans(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  invoice_title TEXT NOT NULL DEFAULT 'FATURA',
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  discount_amount NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  due_date DATE NOT NULL DEFAULT CURRENT_DATE,
  paid_at TIMESTAMP WITH TIME ZONE,
  payment_method TEXT,
  pix_key TEXT,
  pix_key_type TEXT,
  mercadopago_preference_id TEXT,
  mercadopago_payment_id TEXT,
  client_name TEXT,
  client_email TEXT,
  client_phone TEXT,
  client_document TEXT,
  client_address TEXT,
  company_name TEXT,
  company_document TEXT,
  company_address TEXT,
  company_phone TEXT,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#2563eb',
  notes TEXT,
  public_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own invoices"
  ON public.invoices FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can view invoices by token"
  ON public.invoices FOR SELECT
  TO anon
  USING (true);

-- Trigger to update updated_at
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invoice_recurring_plans_updated_at
  BEFORE UPDATE ON public.invoice_recurring_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
