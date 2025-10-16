-- Create table to track button link clicks
CREATE TABLE public.button_link_clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chatbot_id UUID REFERENCES public.chatbots(id) ON DELETE CASCADE,
  ai_agent_id UUID REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  conversation_id UUID,
  button_text TEXT NOT NULL,
  button_url TEXT NOT NULL,
  node_id TEXT,
  visitor_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraint to ensure either chatbot_id or ai_agent_id is set, but not both
  CONSTRAINT check_single_parent CHECK (
    (chatbot_id IS NOT NULL AND ai_agent_id IS NULL) OR
    (chatbot_id IS NULL AND ai_agent_id IS NOT NULL)
  )
);

-- Enable Row Level Security
ALTER TABLE public.button_link_clicks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Chatbot owners can view their clicks"
ON public.button_link_clicks
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chatbots
    WHERE chatbots.id = button_link_clicks.chatbot_id
    AND chatbots.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.ai_agents
    WHERE ai_agents.id = button_link_clicks.ai_agent_id
    AND ai_agents.user_id = auth.uid()
  )
);

CREATE POLICY "Public can create clicks"
ON public.button_link_clicks
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view all clicks"
ON public.button_link_clicks
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for better performance
CREATE INDEX idx_button_clicks_chatbot ON public.button_link_clicks(chatbot_id);
CREATE INDEX idx_button_clicks_agent ON public.button_link_clicks(ai_agent_id);
CREATE INDEX idx_button_clicks_created ON public.button_link_clicks(created_at DESC);