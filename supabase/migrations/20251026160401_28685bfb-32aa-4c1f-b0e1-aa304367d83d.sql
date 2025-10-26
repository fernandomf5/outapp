-- Create agent_services table
CREATE TABLE IF NOT EXISTS public.agent_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  price NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agent_services ENABLE ROW LEVEL SECURITY;

-- Create policies for agent_services
CREATE POLICY "Agent owners can manage services"
ON public.agent_services
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM ai_agents
    WHERE ai_agents.id = agent_services.agent_id
    AND ai_agents.user_id = auth.uid()
  )
);

CREATE POLICY "Public can view active services"
ON public.agent_services
FOR SELECT
USING (is_active = true);

-- Add service_id to agent_appointments
ALTER TABLE public.agent_appointments
ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES agent_services(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_agent_services_agent_id ON agent_services(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_appointments_scheduled_date ON agent_appointments(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_agent_appointments_agent_service ON agent_appointments(agent_id, service_id, scheduled_date);