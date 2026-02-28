
-- Create table for agent chat flows
CREATE TABLE public.agent_chat_flows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  config JSONB NOT NULL DEFAULT '{"nodes": [], "edges": []}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agent_chat_flows ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own flows"
ON public.agent_chat_flows FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own flows"
ON public.agent_chat_flows FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own flows"
ON public.agent_chat_flows FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own flows"
ON public.agent_chat_flows FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_agent_chat_flows_updated_at
BEFORE UPDATE ON public.agent_chat_flows
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for faster lookups
CREATE INDEX idx_agent_chat_flows_agent_id ON public.agent_chat_flows(agent_id);
CREATE INDEX idx_agent_chat_flows_user_id ON public.agent_chat_flows(user_id);
