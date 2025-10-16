-- Criar tabela de recursos (funcionalidades)
CREATE TABLE public.features (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  key TEXT NOT NULL UNIQUE,
  category TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de relação entre planos e recursos
CREATE TABLE public.plan_features (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  feature_id UUID NOT NULL REFERENCES public.features(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(plan_id, feature_id)
);

-- Criar tabela de relação entre vouchers e recursos
CREATE TABLE public.voucher_features (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  voucher_id UUID NOT NULL REFERENCES public.vouchers(id) ON DELETE CASCADE,
  feature_id UUID NOT NULL REFERENCES public.features(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(voucher_id, feature_id)
);

-- Adicionar campo de duração customizada em vouchers
ALTER TABLE public.vouchers ADD COLUMN duration_days INTEGER;

-- Habilitar RLS
ALTER TABLE public.features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voucher_features ENABLE ROW LEVEL SECURITY;

-- Políticas para features
CREATE POLICY "Anyone can view active features"
ON public.features FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage features"
ON public.features FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Políticas para plan_features
CREATE POLICY "Anyone can view plan features"
ON public.plan_features FOR SELECT
USING (true);

CREATE POLICY "Admins can manage plan features"
ON public.plan_features FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Políticas para voucher_features
CREATE POLICY "Anyone can view voucher features"
ON public.voucher_features FOR SELECT
USING (true);

CREATE POLICY "Admins can manage voucher features"
ON public.voucher_features FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Inserir recursos padrão do sistema
INSERT INTO public.features (name, description, key, category) VALUES
('Chatbot Web', 'Criar e gerenciar chatbots para websites', 'chatbot_web', 'Automação'),
('Agente IA', 'Criar agentes de IA inteligentes', 'ai_agent', 'Automação'),
('CRM Contatos', 'Gerenciar contatos e leads', 'crm_contacts', 'CRM'),
('Tracking Pixels', 'Gerenciar pixels de conversão', 'tracking_pixels', 'Marketing'),
('Clonador de Páginas', 'Clonar páginas web', 'page_cloner', 'Marketing'),
('Link Shortener', 'Encurtar e gerenciar links', 'link_shortener', 'Marketing'),
('WhatsApp Link', 'Gerar links diretos para WhatsApp', 'whatsapp_link', 'Comunicação'),
('Suporte com Tickets', 'Sistema de tickets de suporte', 'ticket_system', 'Suporte'),
('Conversas Chatbot', 'Visualizar conversas dos chatbots', 'chatbot_conversations', 'Automação');