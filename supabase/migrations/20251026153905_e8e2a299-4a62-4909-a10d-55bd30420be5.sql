-- Adicionar política de DELETE para agent_conversations
CREATE POLICY "Agent owners can delete their conversations"
ON public.agent_conversations
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM ai_agents
    WHERE ai_agents.id = agent_conversations.agent_id
    AND ai_agents.user_id = auth.uid()
  )
);

-- Adicionar política de DELETE para agent_messages
CREATE POLICY "Agent owners can delete messages from their conversations"
ON public.agent_messages
FOR DELETE
USING (
  EXISTS (
    SELECT 1 
    FROM agent_conversations ac
    JOIN ai_agents aa ON aa.id = ac.agent_id
    WHERE ac.id = agent_messages.conversation_id
    AND aa.user_id = auth.uid()
  )
);