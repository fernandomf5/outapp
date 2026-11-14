DROP POLICY IF EXISTS "Public can create conversations" ON public.agent_conversations;
CREATE POLICY "Public can create conversations for existing agents" ON public.agent_conversations FOR INSERT TO anon, authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.ai_agents a WHERE a.id = agent_conversations.agent_id));

DROP POLICY IF EXISTS "Public can create messages" ON public.agent_messages;
CREATE POLICY "Public can create messages in existing conversations" ON public.agent_messages FOR INSERT TO anon, authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.agent_conversations c WHERE c.id = agent_messages.conversation_id));

DROP POLICY IF EXISTS "Public can create appointments" ON public.agent_appointments;
CREATE POLICY "Public can create appointments for existing agents" ON public.agent_appointments FOR INSERT TO anon, authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.ai_agents a WHERE a.id = agent_appointments.agent_id));