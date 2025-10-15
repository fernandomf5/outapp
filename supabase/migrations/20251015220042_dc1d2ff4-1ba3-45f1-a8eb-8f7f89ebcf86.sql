-- Tabela de conversas do chatbot
CREATE TABLE IF NOT EXISTS public.chatbot_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id UUID NOT NULL REFERENCES public.chatbots(id) ON DELETE CASCADE,
  visitor_name TEXT,
  visitor_email TEXT,
  visitor_phone TEXT,
  session_id TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Tabela de mensagens da conversa
CREATE TABLE IF NOT EXISTS public.chatbot_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.chatbot_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'bot', 'admin')),
  content TEXT NOT NULL,
  media_url TEXT,
  media_type TEXT,
  node_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_chatbot_conversations_chatbot_id ON public.chatbot_conversations(chatbot_id);
CREATE INDEX idx_chatbot_conversations_session_id ON public.chatbot_conversations(session_id);
CREATE INDEX idx_chatbot_conversations_status ON public.chatbot_conversations(status);
CREATE INDEX idx_chatbot_messages_conversation_id ON public.chatbot_messages(conversation_id);
CREATE INDEX idx_chatbot_messages_created_at ON public.chatbot_messages(created_at);

-- RLS Policies
ALTER TABLE public.chatbot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_messages ENABLE ROW LEVEL SECURITY;

-- Política: Donos de chatbot podem ver conversas de seus bots
CREATE POLICY "Chatbot owners can view their conversations"
ON public.chatbot_conversations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chatbots
    WHERE chatbots.id = chatbot_conversations.chatbot_id
    AND chatbots.user_id = auth.uid()
  )
);

-- Política: Admins podem ver todas as conversas
CREATE POLICY "Admins can view all conversations"
ON public.chatbot_conversations FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Política: Sistema pode criar conversas (sem auth)
CREATE POLICY "Public can create conversations"
ON public.chatbot_conversations FOR INSERT
WITH CHECK (true);

-- Política: Donos de chatbot podem atualizar conversas
CREATE POLICY "Chatbot owners can update their conversations"
ON public.chatbot_conversations FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.chatbots
    WHERE chatbots.id = chatbot_conversations.chatbot_id
    AND chatbots.user_id = auth.uid()
  )
);

-- Política: Donos de chatbot podem ver mensagens de seus bots
CREATE POLICY "Chatbot owners can view messages"
ON public.chatbot_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chatbot_conversations cc
    JOIN public.chatbots cb ON cb.id = cc.chatbot_id
    WHERE cc.id = chatbot_messages.conversation_id
    AND cb.user_id = auth.uid()
  )
);

-- Política: Admins podem ver todas as mensagens
CREATE POLICY "Admins can view all messages"
ON public.chatbot_messages FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Política: Sistema pode criar mensagens (sem auth)
CREATE POLICY "Public can create messages"
ON public.chatbot_messages FOR INSERT
WITH CHECK (true);

-- Política: Donos de chatbot podem criar mensagens (admin response)
CREATE POLICY "Chatbot owners can create admin messages"
ON public.chatbot_messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chatbot_conversations cc
    JOIN public.chatbots cb ON cb.id = cc.chatbot_id
    WHERE cc.id = chatbot_messages.conversation_id
    AND cb.user_id = auth.uid()
  )
);