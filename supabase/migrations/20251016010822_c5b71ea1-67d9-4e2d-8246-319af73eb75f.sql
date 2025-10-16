-- Permitir que qualquer pessoa visualize chatbots ativos (necessário para o chat público)
CREATE POLICY "Public can view active chatbots"
ON public.chatbots
FOR SELECT
USING (is_active = true);

-- Permitir que qualquer pessoa visualize ai_agents ativos (necessário para o chat público de agentes IA)
CREATE POLICY "Public can view active ai_agents"
ON public.ai_agents
FOR SELECT
USING (is_active = true);