-- Tabela de clientes dos agentes (cada agente tem seus próprios clientes)
CREATE TABLE public.agent_customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_login_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(agent_id, email)
);

-- Tabela de conversas entre clientes e agentes
CREATE TABLE public.agent_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.agent_customers(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_message_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de mensagens das conversas
CREATE TABLE public.agent_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.agent_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('customer', 'agent')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de agendamentos
CREATE TABLE public.agent_appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.agent_customers(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.agent_conversations(id) ON DELETE SET NULL,
  service_name TEXT NOT NULL,
  service_description TEXT,
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  customer_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de pedidos
CREATE TABLE public.agent_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.agent_customers(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.agent_conversations(id) ON DELETE SET NULL,
  order_number TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled')),
  delivery_address TEXT,
  customer_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_agent_customers_agent ON public.agent_customers(agent_id);
CREATE INDEX idx_agent_conversations_agent ON public.agent_conversations(agent_id);
CREATE INDEX idx_agent_conversations_customer ON public.agent_conversations(customer_id);
CREATE INDEX idx_agent_messages_conversation ON public.agent_messages(conversation_id);
CREATE INDEX idx_agent_appointments_agent ON public.agent_appointments(agent_id);
CREATE INDEX idx_agent_appointments_customer ON public.agent_appointments(customer_id);
CREATE INDEX idx_agent_orders_agent ON public.agent_orders(agent_id);
CREATE INDEX idx_agent_orders_customer ON public.agent_orders(customer_id);

-- Enable RLS
ALTER TABLE public.agent_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies para agent_customers
CREATE POLICY "Public can create customer accounts"
  ON public.agent_customers FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Customers can view their own data"
  ON public.agent_customers FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Agent owners can view their customers"
  ON public.agent_customers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ai_agents
      WHERE ai_agents.id = agent_customers.agent_id
      AND ai_agents.user_id = auth.uid()
    )
  );

-- RLS Policies para agent_conversations
CREATE POLICY "Public can create conversations"
  ON public.agent_conversations FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Public can view conversations"
  ON public.agent_conversations FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Agent owners can view their conversations"
  ON public.agent_conversations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ai_agents
      WHERE ai_agents.id = agent_conversations.agent_id
      AND ai_agents.user_id = auth.uid()
    )
  );

CREATE POLICY "Agent owners can update their conversations"
  ON public.agent_conversations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ai_agents
      WHERE ai_agents.id = agent_conversations.agent_id
      AND ai_agents.user_id = auth.uid()
    )
  );

-- RLS Policies para agent_messages
CREATE POLICY "Public can create messages"
  ON public.agent_messages FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Public can view messages"
  ON public.agent_messages FOR SELECT
  TO anon, authenticated
  USING (true);

-- RLS Policies para agent_appointments
CREATE POLICY "Public can create appointments"
  ON public.agent_appointments FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Public can view appointments"
  ON public.agent_appointments FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Agent owners can manage appointments"
  ON public.agent_appointments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ai_agents
      WHERE ai_agents.id = agent_appointments.agent_id
      AND ai_agents.user_id = auth.uid()
    )
  );

-- RLS Policies para agent_orders
CREATE POLICY "Public can create orders"
  ON public.agent_orders FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Public can view orders"
  ON public.agent_orders FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Agent owners can manage orders"
  ON public.agent_orders FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ai_agents
      WHERE ai_agents.id = agent_orders.agent_id
      AND ai_agents.user_id = auth.uid()
    )
  );

-- Trigger para atualizar updated_at
CREATE TRIGGER update_agent_customers_updated_at
  BEFORE UPDATE ON public.agent_customers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agent_conversations_updated_at
  BEFORE UPDATE ON public.agent_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agent_appointments_updated_at
  BEFORE UPDATE ON public.agent_appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agent_orders_updated_at
  BEFORE UPDATE ON public.agent_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();