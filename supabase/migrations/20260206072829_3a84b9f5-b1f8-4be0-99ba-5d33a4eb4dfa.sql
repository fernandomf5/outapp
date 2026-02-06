-- Create table for catalog customers
CREATE TABLE public.catalog_customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  catalog_id UUID NOT NULL REFERENCES public.catalogs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  orders_count INTEGER DEFAULT 0,
  total_spent NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for catalog orders
CREATE TABLE public.catalog_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  catalog_id UUID NOT NULL REFERENCES public.catalogs(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.catalog_customers(id) ON DELETE SET NULL,
  order_number TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_email TEXT,
  customer_address TEXT,
  items JSONB NOT NULL DEFAULT '[]',
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.catalog_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_orders ENABLE ROW LEVEL SECURITY;

-- RLS policies for catalog_customers
CREATE POLICY "Users can view customers of their catalogs" 
ON public.catalog_customers FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.catalogs c 
    WHERE c.id = catalog_id AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert customers to their catalogs" 
ON public.catalog_customers FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.catalogs c 
    WHERE c.id = catalog_id AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update customers of their catalogs" 
ON public.catalog_customers FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.catalogs c 
    WHERE c.id = catalog_id AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete customers of their catalogs" 
ON public.catalog_customers FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.catalogs c 
    WHERE c.id = catalog_id AND c.user_id = auth.uid()
  )
);

-- RLS policies for catalog_orders
CREATE POLICY "Users can view orders of their catalogs" 
ON public.catalog_orders FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.catalogs c 
    WHERE c.id = catalog_id AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Anyone can insert orders to public catalogs" 
ON public.catalog_orders FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update orders of their catalogs" 
ON public.catalog_orders FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.catalogs c 
    WHERE c.id = catalog_id AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete orders of their catalogs" 
ON public.catalog_orders FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.catalogs c 
    WHERE c.id = catalog_id AND c.user_id = auth.uid()
  )
);

-- Triggers for updated_at
CREATE TRIGGER update_catalog_customers_updated_at
BEFORE UPDATE ON public.catalog_customers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_catalog_orders_updated_at
BEFORE UPDATE ON public.catalog_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for performance
CREATE INDEX idx_catalog_orders_catalog_id ON public.catalog_orders(catalog_id);
CREATE INDEX idx_catalog_orders_customer_id ON public.catalog_orders(customer_id);
CREATE INDEX idx_catalog_customers_catalog_id ON public.catalog_customers(catalog_id);