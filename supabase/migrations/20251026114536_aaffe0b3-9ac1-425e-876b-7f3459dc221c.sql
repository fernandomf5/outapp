-- Adicionar campo de tipo de acesso aos chatbots
ALTER TABLE public.chatbots 
ADD COLUMN access_type text NOT NULL DEFAULT 'public' CHECK (access_type IN ('public', 'private'));

-- Adicionar campo de tipo de acesso aos agentes IA
ALTER TABLE public.ai_agents 
ADD COLUMN access_type text NOT NULL DEFAULT 'public' CHECK (access_type IN ('public', 'private'));

-- Criar tabela para gerenciar aprovações de acesso a chatbots privados
CREATE TABLE public.chatbot_access_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id uuid NOT NULL REFERENCES public.chatbots(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.chatbot_customers(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at timestamp with time zone NOT NULL DEFAULT now(),
  reviewed_at timestamp with time zone,
  reviewed_by uuid REFERENCES auth.users(id),
  notes text,
  UNIQUE(chatbot_id, customer_id)
);

-- Criar tabela para gerenciar aprovações de acesso a agentes IA privados
CREATE TABLE public.agent_access_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.agent_customers(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at timestamp with time zone NOT NULL DEFAULT now(),
  reviewed_at timestamp with time zone,
  reviewed_by uuid REFERENCES auth.users(id),
  notes text,
  UNIQUE(agent_id, customer_id)
);

-- RLS para chatbot_access_requests
ALTER TABLE public.chatbot_access_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Chatbot owners can view access requests"
ON public.chatbot_access_requests
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chatbots
    WHERE chatbots.id = chatbot_access_requests.chatbot_id
    AND chatbots.user_id = auth.uid()
  )
);

CREATE POLICY "Chatbot owners can manage access requests"
ON public.chatbot_access_requests
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.chatbots
    WHERE chatbots.id = chatbot_access_requests.chatbot_id
    AND chatbots.user_id = auth.uid()
  )
);

CREATE POLICY "Public can create access requests"
ON public.chatbot_access_requests
FOR INSERT
WITH CHECK (true);

-- RLS para agent_access_requests
ALTER TABLE public.agent_access_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agent owners can view access requests"
ON public.agent_access_requests
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.ai_agents
    WHERE ai_agents.id = agent_access_requests.agent_id
    AND ai_agents.user_id = auth.uid()
  )
);

CREATE POLICY "Agent owners can manage access requests"
ON public.agent_access_requests
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.ai_agents
    WHERE ai_agents.id = agent_access_requests.agent_id
    AND ai_agents.user_id = auth.uid()
  )
);

CREATE POLICY "Public can create access requests"
ON public.agent_access_requests
FOR INSERT
WITH CHECK (true);

-- Índices para performance
CREATE INDEX idx_chatbot_access_requests_chatbot_id ON public.chatbot_access_requests(chatbot_id);
CREATE INDEX idx_chatbot_access_requests_status ON public.chatbot_access_requests(status);
CREATE INDEX idx_agent_access_requests_agent_id ON public.agent_access_requests(agent_id);
CREATE INDEX idx_agent_access_requests_status ON public.agent_access_requests(status);