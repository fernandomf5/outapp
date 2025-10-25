-- Tabela de produtos/serviços do agente
CREATE TABLE public.agent_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  category TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  stock_quantity INTEGER,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de avaliações
CREATE TABLE public.agent_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.agent_customers(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.agent_orders(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES public.agent_appointments(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de horários de funcionamento
CREATE TABLE public.agent_schedule (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de bloqueios de agenda
CREATE TABLE public.agent_schedule_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de mensagens automáticas
CREATE TABLE public.agent_auto_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('welcome', 'appointment_reminder', 'order_confirmation', 'follow_up', 'inactive_customer')),
  message_content TEXT NOT NULL,
  delay_hours INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de pagamentos
CREATE TABLE public.agent_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.agent_orders(id) ON DELETE SET NULL,
  customer_id UUID NOT NULL REFERENCES public.agent_customers(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  payment_method TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de notificações para o criador
CREATE TABLE public.agent_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  reference_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_agent_products_agent ON public.agent_products(agent_id);
CREATE INDEX idx_agent_reviews_agent ON public.agent_reviews(agent_id);
CREATE INDEX idx_agent_reviews_customer ON public.agent_reviews(customer_id);
CREATE INDEX idx_agent_schedule_agent ON public.agent_schedule(agent_id);
CREATE INDEX idx_agent_schedule_blocks_agent ON public.agent_schedule_blocks(agent_id);
CREATE INDEX idx_agent_auto_messages_agent ON public.agent_auto_messages(agent_id);
CREATE INDEX idx_agent_payments_agent ON public.agent_payments(agent_id);
CREATE INDEX idx_agent_payments_customer ON public.agent_payments(customer_id);
CREATE INDEX idx_agent_notifications_agent ON public.agent_notifications(agent_id);

-- Enable RLS
ALTER TABLE public.agent_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_schedule_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_auto_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public can view available products"
  ON public.agent_products FOR SELECT
  TO anon, authenticated
  USING (is_available = true);

CREATE POLICY "Agent owners can manage products"
  ON public.agent_products FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ai_agents
      WHERE ai_agents.id = agent_products.agent_id
      AND ai_agents.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view reviews"
  ON public.agent_reviews FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Customers can create reviews"
  ON public.agent_reviews FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Agent owners can view all reviews"
  ON public.agent_reviews FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ai_agents
      WHERE ai_agents.id = agent_reviews.agent_id
      AND ai_agents.user_id = auth.uid()
    )
  );

CREATE POLICY "Agent owners can manage schedule"
  ON public.agent_schedule FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ai_agents
      WHERE ai_agents.id = agent_schedule.agent_id
      AND ai_agents.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view active schedule"
  ON public.agent_schedule FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Agent owners can manage schedule blocks"
  ON public.agent_schedule_blocks FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ai_agents
      WHERE ai_agents.id = agent_schedule_blocks.agent_id
      AND ai_agents.user_id = auth.uid()
    )
  );

CREATE POLICY "Agent owners can manage auto messages"
  ON public.agent_auto_messages FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ai_agents
      WHERE ai_agents.id = agent_auto_messages.agent_id
      AND ai_agents.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view payments"
  ON public.agent_payments FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public can create payments"
  ON public.agent_payments FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Agent owners can manage payments"
  ON public.agent_payments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ai_agents
      WHERE ai_agents.id = agent_payments.agent_id
      AND ai_agents.user_id = auth.uid()
    )
  );

CREATE POLICY "Agent owners can manage notifications"
  ON public.agent_notifications FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ai_agents
      WHERE ai_agents.id = agent_notifications.agent_id
      AND ai_agents.user_id = auth.uid()
    )
  );

-- Triggers
CREATE TRIGGER update_agent_products_updated_at
  BEFORE UPDATE ON public.agent_products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agent_schedule_updated_at
  BEFORE UPDATE ON public.agent_schedule
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agent_auto_messages_updated_at
  BEFORE UPDATE ON public.agent_auto_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();