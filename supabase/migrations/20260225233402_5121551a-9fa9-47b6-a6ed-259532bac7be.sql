
-- Table for user-created checkout pages
CREATE TABLE public.checkouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Product/service info
  item_name TEXT NOT NULL,
  item_description TEXT,
  item_image_url TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  
  -- Customization
  primary_color TEXT DEFAULT '#8B5CF6',
  banner_url TEXT,
  success_message TEXT DEFAULT 'Pagamento realizado com sucesso!',
  redirect_url TEXT,
  
  -- Mercado Pago config (per-checkout, optional override)
  mp_access_token TEXT,
  mp_public_key TEXT,
  
  -- Stats
  total_sales INTEGER DEFAULT 0,
  total_revenue NUMERIC(10,2) DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, slug)
);

-- Table for checkout orders/payments
CREATE TABLE public.checkout_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  checkout_id UUID NOT NULL REFERENCES public.checkouts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  customer_cpf TEXT,
  
  amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  payment_id TEXT,
  
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.checkouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkout_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for checkouts
CREATE POLICY "Users can view their own checkouts" ON public.checkouts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own checkouts" ON public.checkouts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own checkouts" ON public.checkouts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own checkouts" ON public.checkouts FOR DELETE USING (auth.uid() = user_id);

-- Public read for active checkouts (for the public checkout page)
CREATE POLICY "Anyone can view active checkouts" ON public.checkouts FOR SELECT USING (is_active = true);

-- RLS Policies for checkout_orders
CREATE POLICY "Users can view their own checkout orders" ON public.checkout_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone can create checkout orders" ON public.checkout_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own checkout orders" ON public.checkout_orders FOR UPDATE USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_checkouts_updated_at BEFORE UPDATE ON public.checkouts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_checkout_orders_updated_at BEFORE UPDATE ON public.checkout_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
