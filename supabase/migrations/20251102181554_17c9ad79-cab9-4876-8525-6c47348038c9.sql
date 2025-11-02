-- Criar tabela para fluxos de chatbot
CREATE TABLE IF NOT EXISTS public.chatbot_flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id UUID NOT NULL REFERENCES public.chatbots(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_start BOOLEAN DEFAULT false,
  message TEXT NOT NULL,
  buttons JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  order_index INTEGER DEFAULT 0
);

-- Criar índice para melhor performance
CREATE INDEX idx_chatbot_flows_chatbot_id ON public.chatbot_flows(chatbot_id);
CREATE INDEX idx_chatbot_flows_is_start ON public.chatbot_flows(chatbot_id, is_start);

-- RLS Policies
ALTER TABLE public.chatbot_flows ENABLE ROW LEVEL SECURITY;

-- Usuários podem gerenciar fluxos dos seus chatbots
CREATE POLICY "Users can manage flows for their chatbots"
  ON public.chatbot_flows
  FOR ALL
  USING (
    chatbot_id IN (
      SELECT id FROM public.chatbots WHERE user_id = auth.uid()
    )
  );

-- Público pode visualizar fluxos
CREATE POLICY "Public can view flows"
  ON public.chatbot_flows
  FOR SELECT
  USING (true);

COMMENT ON TABLE public.chatbot_flows IS 'Armazena os fluxos de conversação com botões para os chatbots';
COMMENT ON COLUMN public.chatbot_flows.buttons IS 'Array de botões no formato: [{"text": "Texto", "action": "link|flow", "value": "url ou flow_id"}]';