-- Tabela de serviços do usuário (diferente da tabela services existente que é para chatbot)
CREATE TABLE public.user_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  price_type VARCHAR(50) DEFAULT 'fixed', -- 'fixed', 'hourly', 'daily', 'monthly', 'quote'
  duration_minutes INTEGER,
  image_url TEXT,
  requires_scheduling BOOLEAN DEFAULT false,
  max_capacity INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  tags TEXT[],
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para user_services
CREATE INDEX idx_user_services_user_id ON public.user_services(user_id);
CREATE INDEX idx_user_services_category ON public.user_services(category);
CREATE INDEX idx_user_services_active ON public.user_services(is_active);

-- RLS para user_services
ALTER TABLE public.user_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own user_services" ON public.user_services
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own user_services" ON public.user_services
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own user_services" ON public.user_services
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own user_services" ON public.user_services
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_user_services_updated_at
  BEFORE UPDATE ON public.user_services
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();