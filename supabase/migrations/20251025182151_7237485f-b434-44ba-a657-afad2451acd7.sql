-- Create chatbot_customers table
CREATE TABLE public.chatbot_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id UUID NOT NULL REFERENCES public.chatbots(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create chatbot_products table
CREATE TABLE public.chatbot_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id UUID NOT NULL REFERENCES public.chatbots(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('product', 'service')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create chatbot_appointments table
CREATE TABLE public.chatbot_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id UUID NOT NULL REFERENCES public.chatbots(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.chatbot_customers(id) ON DELETE CASCADE,
  date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create chatbot_orders table
CREATE TABLE public.chatbot_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id UUID NOT NULL REFERENCES public.chatbots(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.chatbot_customers(id) ON DELETE CASCADE,
  total DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create chatbot_order_items table
CREATE TABLE public.chatbot_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.chatbot_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.chatbot_products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create chatbot_reviews table
CREATE TABLE public.chatbot_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id UUID NOT NULL REFERENCES public.chatbots(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.chatbot_customers(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create chatbot_automations table
CREATE TABLE public.chatbot_automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id UUID NOT NULL REFERENCES public.chatbots(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL,
  message TEXT NOT NULL,
  delay_minutes INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create chatbot_schedules table
CREATE TABLE public.chatbot_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id UUID NOT NULL REFERENCES public.chatbots(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create chatbot_notifications table
CREATE TABLE public.chatbot_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id UUID NOT NULL REFERENCES public.chatbots(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chatbot_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chatbot_customers
CREATE POLICY "Users can view customers for their chatbots"
  ON public.chatbot_customers FOR SELECT
  USING (
    chatbot_id IN (
      SELECT id FROM public.chatbots WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert customers for their chatbots"
  ON public.chatbot_customers FOR INSERT
  WITH CHECK (
    chatbot_id IN (
      SELECT id FROM public.chatbots WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update customers for their chatbots"
  ON public.chatbot_customers FOR UPDATE
  USING (
    chatbot_id IN (
      SELECT id FROM public.chatbots WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete customers for their chatbots"
  ON public.chatbot_customers FOR DELETE
  USING (
    chatbot_id IN (
      SELECT id FROM public.chatbots WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for chatbot_products
CREATE POLICY "Users can manage products for their chatbots"
  ON public.chatbot_products FOR ALL
  USING (
    chatbot_id IN (
      SELECT id FROM public.chatbots WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for chatbot_appointments
CREATE POLICY "Users can manage appointments for their chatbots"
  ON public.chatbot_appointments FOR ALL
  USING (
    chatbot_id IN (
      SELECT id FROM public.chatbots WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for chatbot_orders
CREATE POLICY "Users can view orders for their chatbots"
  ON public.chatbot_orders FOR SELECT
  USING (
    chatbot_id IN (
      SELECT id FROM public.chatbots WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert orders for their chatbots"
  ON public.chatbot_orders FOR INSERT
  WITH CHECK (
    chatbot_id IN (
      SELECT id FROM public.chatbots WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update orders for their chatbots"
  ON public.chatbot_orders FOR UPDATE
  USING (
    chatbot_id IN (
      SELECT id FROM public.chatbots WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for chatbot_order_items
CREATE POLICY "Users can view order items for their chatbots"
  ON public.chatbot_order_items FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM public.chatbot_orders 
      WHERE chatbot_id IN (
        SELECT id FROM public.chatbots WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert order items for their chatbots"
  ON public.chatbot_order_items FOR INSERT
  WITH CHECK (
    order_id IN (
      SELECT id FROM public.chatbot_orders 
      WHERE chatbot_id IN (
        SELECT id FROM public.chatbots WHERE user_id = auth.uid()
      )
    )
  );

-- RLS Policies for chatbot_reviews
CREATE POLICY "Users can view reviews for their chatbots"
  ON public.chatbot_reviews FOR SELECT
  USING (
    chatbot_id IN (
      SELECT id FROM public.chatbots WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for chatbot_automations
CREATE POLICY "Users can manage automations for their chatbots"
  ON public.chatbot_automations FOR ALL
  USING (
    chatbot_id IN (
      SELECT id FROM public.chatbots WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for chatbot_schedules
CREATE POLICY "Users can manage schedules for their chatbots"
  ON public.chatbot_schedules FOR ALL
  USING (
    chatbot_id IN (
      SELECT id FROM public.chatbots WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for chatbot_notifications
CREATE POLICY "Users can manage notifications for their chatbots"
  ON public.chatbot_notifications FOR ALL
  USING (
    chatbot_id IN (
      SELECT id FROM public.chatbots WHERE user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_chatbot_customers_chatbot_id ON public.chatbot_customers(chatbot_id);
CREATE INDEX idx_chatbot_products_chatbot_id ON public.chatbot_products(chatbot_id);
CREATE INDEX idx_chatbot_appointments_chatbot_id ON public.chatbot_appointments(chatbot_id);
CREATE INDEX idx_chatbot_orders_chatbot_id ON public.chatbot_orders(chatbot_id);
CREATE INDEX idx_chatbot_order_items_order_id ON public.chatbot_order_items(order_id);
CREATE INDEX idx_chatbot_reviews_chatbot_id ON public.chatbot_reviews(chatbot_id);
CREATE INDEX idx_chatbot_automations_chatbot_id ON public.chatbot_automations(chatbot_id);
CREATE INDEX idx_chatbot_schedules_chatbot_id ON public.chatbot_schedules(chatbot_id);
CREATE INDEX idx_chatbot_notifications_chatbot_id ON public.chatbot_notifications(chatbot_id);