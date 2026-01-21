-- Create table for WhatsApp connections with QR code support
CREATE TABLE IF NOT EXISTS public.whatsapp_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  agent_id UUID REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  instance_name TEXT NOT NULL,
  instance_key TEXT UNIQUE,
  phone_number TEXT,
  status TEXT DEFAULT 'disconnected' CHECK (status IN ('disconnected', 'connecting', 'connected', 'qr_code')),
  qr_code TEXT,
  qr_code_expires_at TIMESTAMPTZ,
  webhook_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create table for agent knowledge base / training data
CREATE TABLE IF NOT EXISTS public.agent_knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  content_type TEXT DEFAULT 'text' CHECK (content_type IN ('text', 'faq', 'document', 'url')),
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create table for WhatsApp messages history
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID NOT NULL REFERENCES public.whatsapp_instances(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.agent_conversations(id) ON DELETE SET NULL,
  whatsapp_message_id TEXT,
  from_number TEXT NOT NULL,
  to_number TEXT,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'audio', 'video', 'document', 'sticker', 'location')),
  content TEXT,
  media_url TEXT,
  media_transcription TEXT,
  media_analysis TEXT,
  direction TEXT DEFAULT 'incoming' CHECK (direction IN ('incoming', 'outgoing')),
  status TEXT DEFAULT 'received' CHECK (status IN ('received', 'sent', 'delivered', 'read', 'failed')),
  ai_response TEXT,
  transferred_to_human BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_user ON public.whatsapp_instances(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_agent ON public.whatsapp_instances(agent_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_instance ON public.whatsapp_messages(instance_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_from ON public.whatsapp_messages(from_number);
CREATE INDEX IF NOT EXISTS idx_agent_knowledge_base_agent ON public.agent_knowledge_base(agent_id);

-- Enable RLS
ALTER TABLE public.whatsapp_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for whatsapp_instances
CREATE POLICY "Users can view their own WhatsApp instances"
  ON public.whatsapp_instances FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own WhatsApp instances"
  ON public.whatsapp_instances FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own WhatsApp instances"
  ON public.whatsapp_instances FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own WhatsApp instances"
  ON public.whatsapp_instances FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for agent_knowledge_base
CREATE POLICY "Users can manage knowledge base for their agents"
  ON public.agent_knowledge_base FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.ai_agents 
      WHERE id = agent_knowledge_base.agent_id 
      AND user_id = auth.uid()
    )
  );

-- RLS Policies for whatsapp_messages
CREATE POLICY "Users can view messages from their instances"
  ON public.whatsapp_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.whatsapp_instances 
      WHERE id = whatsapp_messages.instance_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage all messages"
  ON public.whatsapp_messages FOR ALL
  USING (true)
  WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_whatsapp_instances_updated_at
  BEFORE UPDATE ON public.whatsapp_instances
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agent_knowledge_base_updated_at
  BEFORE UPDATE ON public.agent_knowledge_base
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();