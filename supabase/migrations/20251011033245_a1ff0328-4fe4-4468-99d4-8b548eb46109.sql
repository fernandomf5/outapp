-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create enum for plan types
CREATE TYPE public.plan_type AS ENUM ('free_trial', 'chatbot', 'ai_agent');

-- Create enum for subscription status
CREATE TYPE public.subscription_status AS ENUM ('active', 'expired', 'cancelled');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Create plans table
CREATE TABLE public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  plan_type plan_type NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  duration_days INTEGER NOT NULL,
  features JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  plan_id UUID NOT NULL REFERENCES public.plans(id),
  status subscription_status NOT NULL DEFAULT 'active',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create whatsapp_connections table
CREATE TABLE public.whatsapp_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  phone_number TEXT,
  qr_code TEXT,
  is_connected BOOLEAN NOT NULL DEFAULT false,
  connected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create chatbots table
CREATE TABLE public.chatbots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  whatsapp_connection_id UUID REFERENCES public.whatsapp_connections(id),
  name TEXT NOT NULL,
  description TEXT,
  config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create ai_agents table
CREATE TABLE public.ai_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  whatsapp_connection_id UUID REFERENCES public.whatsapp_connections(id),
  name TEXT NOT NULL,
  description TEXT,
  niche TEXT NOT NULL,
  training_data JSONB NOT NULL DEFAULT '{}',
  config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create tutorial_videos table
CREATE TABLE public.tutorial_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration INTEGER,
  category TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create admin_messages table
CREATE TABLE public.admin_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  user_id UUID,
  sent_to_all BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutorial_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_messages ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON public.plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_whatsapp_connections_updated_at BEFORE UPDATE ON public.whatsapp_connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chatbots_updated_at BEFORE UPDATE ON public.chatbots
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_agents_updated_at BEFORE UPDATE ON public.ai_agents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tutorial_videos_updated_at BEFORE UPDATE ON public.tutorial_videos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for plans
CREATE POLICY "Anyone can view active plans"
  ON public.plans FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage plans"
  ON public.plans FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for subscriptions
CREATE POLICY "Users can view their own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions"
  ON public.subscriptions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert subscriptions"
  ON public.subscriptions FOR INSERT
  WITH CHECK (true);

-- RLS Policies for whatsapp_connections
CREATE POLICY "Users can view their own connections"
  ON public.whatsapp_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own connections"
  ON public.whatsapp_connections FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all connections"
  ON public.whatsapp_connections FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for chatbots
CREATE POLICY "Users can view their own chatbots"
  ON public.chatbots FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own chatbots"
  ON public.chatbots FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all chatbots"
  ON public.chatbots FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for ai_agents
CREATE POLICY "Users can view their own ai_agents"
  ON public.ai_agents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own ai_agents"
  ON public.ai_agents FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all ai_agents"
  ON public.ai_agents FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for tutorial_videos
CREATE POLICY "Anyone can view published videos"
  ON public.tutorial_videos FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins can manage tutorial videos"
  ON public.tutorial_videos FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for admin_messages
CREATE POLICY "Users can view their own messages"
  ON public.admin_messages FOR SELECT
  USING (auth.uid() = user_id OR sent_to_all = true);

CREATE POLICY "Users can update their own message read status"
  ON public.admin_messages FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all messages"
  ON public.admin_messages FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Insert default plans
INSERT INTO public.plans (name, description, plan_type, price, duration_days, features) VALUES
('Trial Gratuito', 'Teste todas as funcionalidades por 3 dias', 'free_trial', 0.00, 3, '{"chatbot": true, "ai_agent": true, "connections": 1, "messages": 100}'::jsonb),
('Plano Chatbot', 'Criação de chatbot e automação', 'chatbot', 49.90, 30, '{"chatbot": true, "ai_agent": false, "connections": 3, "messages": 1000}'::jsonb),
('Plano Agente IA', 'Criação de agente IA inteligente para WhatsApp', 'ai_agent', 89.90, 30, '{"chatbot": true, "ai_agent": true, "connections": 5, "messages": 5000}'::jsonb);