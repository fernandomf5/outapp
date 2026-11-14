ALTER FUNCTION public.move_to_dlq(text,text,bigint,jsonb) SET search_path = '';
ALTER FUNCTION public.read_email_batch(text,integer,integer) SET search_path = '';
ALTER FUNCTION public.enqueue_email(text,jsonb) SET search_path = '';
ALTER FUNCTION public.delete_email(text,bigint) SET search_path = '';

DROP POLICY IF EXISTS "Public can create access requests" ON public.agent_access_requests;
CREATE POLICY "Public can create access requests" ON public.agent_access_requests FOR INSERT TO anon, authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.ai_agents a WHERE a.id = agent_id));

DROP POLICY IF EXISTS "Public can create customer accounts" ON public.agent_customers;
CREATE POLICY "Public can create customer accounts" ON public.agent_customers FOR INSERT TO anon, authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.ai_agents a WHERE a.id = agent_id));

DROP POLICY IF EXISTS "Public can create orders" ON public.agent_orders;
CREATE POLICY "Public can create orders" ON public.agent_orders FOR INSERT TO anon, authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.ai_agents a WHERE a.id = agent_id));

DROP POLICY IF EXISTS "Customers can create reviews" ON public.agent_reviews;
CREATE POLICY "Customers can create reviews" ON public.agent_reviews FOR INSERT TO anon, authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.ai_agents a WHERE a.id = agent_id));
DROP POLICY IF EXISTS "Public can view reviews" ON public.agent_reviews;
CREATE POLICY "Public can view reviews" ON public.agent_reviews FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.ai_agents a WHERE a.id = agent_id));

DROP POLICY IF EXISTS "Public can view and create comments" ON public.aprova_job_comments;
CREATE POLICY "Public can view and create comments" ON public.aprova_job_comments FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.aprova_job_jobs j WHERE j.id = job_id));
DROP POLICY IF EXISTS "Public can insert comments" ON public.aprova_job_comments;
CREATE POLICY "Public can insert comments" ON public.aprova_job_comments FOR INSERT TO anon, authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.aprova_job_jobs j WHERE j.id = job_id));

DROP POLICY IF EXISTS "Anyone can submit briefing responses" ON public.briefing_responses;
DROP POLICY IF EXISTS "Public can create responses" ON public.briefing_responses;
CREATE POLICY "Public can create responses" ON public.briefing_responses FOR INSERT TO anon, authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.briefings b WHERE b.id = briefing_id));

DROP POLICY IF EXISTS "Public can create clicks" ON public.button_link_clicks;
CREATE POLICY "Public can create clicks" ON public.button_link_clicks FOR INSERT TO anon, authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.chatbots c WHERE c.id = chatbot_id)
           OR EXISTS (SELECT 1 FROM public.ai_agents a WHERE a.id = ai_agent_id));

DROP POLICY IF EXISTS "Anyone can insert orders to public catalogs" ON public.catalog_orders;
CREATE POLICY "Anyone can insert orders to public catalogs" ON public.catalog_orders FOR INSERT TO anon, authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.catalogs c WHERE c.id = catalog_id));

DROP POLICY IF EXISTS "Public can create access requests" ON public.chatbot_access_requests;
CREATE POLICY "Public can create access requests" ON public.chatbot_access_requests FOR INSERT TO anon, authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.chatbots c WHERE c.id = chatbot_id));

DROP POLICY IF EXISTS "Public can create conversations" ON public.chatbot_conversations;
CREATE POLICY "Public can create conversations" ON public.chatbot_conversations FOR INSERT TO anon, authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.chatbots c WHERE c.id = chatbot_id));

DROP POLICY IF EXISTS "Public can create messages" ON public.chatbot_messages;
CREATE POLICY "Public can create messages" ON public.chatbot_messages FOR INSERT TO anon, authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.chatbot_conversations c WHERE c.id = conversation_id));

DROP POLICY IF EXISTS "Anyone can record checkout events" ON public.checkout_events;
CREATE POLICY "Anyone can record checkout events" ON public.checkout_events FOR INSERT TO anon, authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.checkouts c WHERE c.id = checkout_id));

DROP POLICY IF EXISTS "Anyone can create checkout orders" ON public.checkout_orders;
CREATE POLICY "Anyone can create checkout orders" ON public.checkout_orders FOR INSERT TO anon, authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.checkouts c WHERE c.id = checkout_id AND c.user_id = checkout_orders.user_id));

DROP POLICY IF EXISTS "Public can create analytics" ON public.cloned_page_analytics;
CREATE POLICY "Public can create analytics" ON public.cloned_page_analytics FOR INSERT TO anon, authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.cloned_pages p WHERE p.id = page_id));

DROP POLICY IF EXISTS "Public can create clicks" ON public.cloned_page_clicks;
CREATE POLICY "Public can create clicks" ON public.cloned_page_clicks FOR INSERT TO anon, authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.cloned_pages p WHERE p.id = page_id));

DROP POLICY IF EXISTS "Public can create leads" ON public.cloned_page_leads;
CREATE POLICY "Public can create leads" ON public.cloned_page_leads FOR INSERT TO anon, authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.cloned_pages p WHERE p.id = page_id));

DROP POLICY IF EXISTS "Anyone can submit contact forms" ON public.contact_form_submissions;
CREATE POLICY "Anyone can submit contact forms" ON public.contact_form_submissions FOR INSERT TO anon, authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.ai_agents a WHERE a.id = agent_id));

DROP POLICY IF EXISTS "Anyone can insert clicks" ON public.link_bio_clicks;
CREATE POLICY "Anyone can insert clicks" ON public.link_bio_clicks FOR INSERT TO anon, authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.link_bios b WHERE b.id = bio_id));

DROP POLICY IF EXISTS "Anyone can submit access requests" ON public.members_area_access_requests;
DROP POLICY IF EXISTS "Usuários podem criar solicitações" ON public.members_area_access_requests;
CREATE POLICY "Anyone can submit access requests" ON public.members_area_access_requests FOR INSERT TO anon, authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.members_areas m WHERE m.id = area_id));

DROP POLICY IF EXISTS "Public can create enrollments" ON public.members_area_enrollments;
CREATE POLICY "Public can create enrollments" ON public.members_area_enrollments FOR INSERT TO anon, authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.members_areas m WHERE m.id = area_id));

DROP POLICY IF EXISTS "System can create ticket notifications" ON public.ticket_notifications;
CREATE POLICY "Users can create own ticket notifications" ON public.ticket_notifications FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());