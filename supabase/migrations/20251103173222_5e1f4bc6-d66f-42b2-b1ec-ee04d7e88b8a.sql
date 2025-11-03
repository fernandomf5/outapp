-- Add policies to allow agent owners to update and delete their customers
CREATE POLICY "Agent owners can update customers"
ON public.agent_customers
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM ai_agents
    WHERE ai_agents.id = agent_customers.agent_id
      AND ai_agents.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM ai_agents
    WHERE ai_agents.id = agent_customers.agent_id
      AND ai_agents.user_id = auth.uid()
  )
);

CREATE POLICY "Agent owners can delete customers"
ON public.agent_customers
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM ai_agents
    WHERE ai_agents.id = agent_customers.agent_id
      AND ai_agents.user_id = auth.uid()
  )
);