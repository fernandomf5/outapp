-- Add customer_id column to history tables to support customers from ClientsManagementPanel
ALTER TABLE public.customer_services_history
ADD COLUMN customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE;

ALTER TABLE public.customer_purchases_history
ADD COLUMN customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE;

ALTER TABLE public.customer_payments_history
ADD COLUMN customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE;

-- Create indexes for customer_id
CREATE INDEX idx_customer_services_customer ON public.customer_services_history(customer_id);
CREATE INDEX idx_customer_purchases_customer ON public.customer_purchases_history(customer_id);
CREATE INDEX idx_customer_payments_customer ON public.customer_payments_history(customer_id);

-- Update RLS policies to allow access for both contact_id and customer_id
DROP POLICY IF EXISTS "Users can view own contact services" ON customer_services_history;
DROP POLICY IF EXISTS "Users can create contact services" ON customer_services_history;
DROP POLICY IF EXISTS "Users can delete own contact services" ON customer_services_history;
DROP POLICY IF EXISTS "Users can view own contact purchases" ON customer_purchases_history;
DROP POLICY IF EXISTS "Users can create contact purchases" ON customer_purchases_history;
DROP POLICY IF EXISTS "Users can delete own contact purchases" ON customer_purchases_history;
DROP POLICY IF EXISTS "Users can view own contact payments" ON customer_payments_history;
DROP POLICY IF EXISTS "Users can create contact payments" ON customer_payments_history;
DROP POLICY IF EXISTS "Users can delete own contact payments" ON customer_payments_history;

CREATE POLICY "Users can view own services history"
ON public.customer_services_history FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create services history"
ON public.customer_services_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own services history"
ON public.customer_services_history FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Users can view own purchases history"
ON public.customer_purchases_history FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create purchases history"
ON public.customer_purchases_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own purchases history"
ON public.customer_purchases_history FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Users can view own payments history"
ON public.customer_payments_history FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create payments history"
ON public.customer_payments_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own payments history"
ON public.customer_payments_history FOR DELETE
USING (auth.uid() = user_id);