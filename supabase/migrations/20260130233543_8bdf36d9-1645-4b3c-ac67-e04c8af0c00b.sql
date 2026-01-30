-- Fix: Allow contact_id to be nullable when using customer_id
ALTER TABLE public.customer_services_history 
ALTER COLUMN contact_id DROP NOT NULL;

ALTER TABLE public.customer_purchases_history 
ALTER COLUMN contact_id DROP NOT NULL;

ALTER TABLE public.customer_payments_history 
ALTER COLUMN contact_id DROP NOT NULL;

-- Add check constraint to ensure at least one of contact_id or customer_id is present
ALTER TABLE public.customer_services_history
ADD CONSTRAINT check_contact_or_customer
CHECK (contact_id IS NOT NULL OR customer_id IS NOT NULL);

ALTER TABLE public.customer_purchases_history
ADD CONSTRAINT check_contact_or_customer
CHECK (contact_id IS NOT NULL OR customer_id IS NOT NULL);

ALTER TABLE public.customer_payments_history
ADD CONSTRAINT check_contact_or_customer
CHECK (contact_id IS NOT NULL OR customer_id IS NOT NULL);