-- Enhancement for Checkout Creator and Members Area integration
-- Adds recurring billing support to checkouts and links it to members area students

-- 1. Update checkouts table to support recurring billing configurations
ALTER TABLE public.checkouts 
ADD COLUMN IF NOT EXISTS billing_type text DEFAULT 'one_time';
ALTER TABLE public.checkouts 
ADD COLUMN IF NOT EXISTS billing_interval text;
ALTER TABLE public.checkouts 
ADD COLUMN IF NOT EXISTS billing_interval_count integer DEFAULT 1;
ALTER TABLE public.checkouts 
ADD COLUMN IF NOT EXISTS billing_cycles integer;

-- 2. Create checkout_subscriptions table to track active student subscriptions
CREATE TABLE IF NOT EXISTS public.checkout_subscriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    checkout_id uuid REFERENCES public.checkouts(id) ON DELETE SET NULL,
    customer_name text NOT NULL,
    customer_email text NOT NULL,
    status text DEFAULT 'active', -- 'active', 'past_due', 'canceled', 'expired'
    current_period_start timestamptz DEFAULT now(),
    current_period_end timestamptz,
    next_billing_date timestamptz,
    billing_type text NOT NULL,
    billing_interval text,
    billing_interval_count integer,
    amount numeric(10,2) NOT NULL,
    payment_method text,
    external_subscription_id text, -- ID from Mercado Pago or other provider
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.checkout_subscriptions TO authenticated;
GRANT ALL ON public.checkout_subscriptions TO service_role;

-- 3. Link checkout_orders to subscriptions
ALTER TABLE public.checkout_orders 
ADD COLUMN IF NOT EXISTS subscription_id uuid REFERENCES public.checkout_subscriptions(id) ON DELETE SET NULL;

-- 4. Enable RLS on subscriptions
ALTER TABLE public.checkout_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own checkout subscriptions"
ON public.checkout_subscriptions
FOR ALL
TO authenticated
USING (auth.uid() = user_id);

-- 5. Add trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at_subscriptions()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_checkout_subscriptions_updated_at ON public.checkout_subscriptions;
CREATE TRIGGER tr_checkout_subscriptions_updated_at
BEFORE UPDATE ON public.checkout_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at_subscriptions();
