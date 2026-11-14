DROP POLICY IF EXISTS "Allow all operations on certificates" ON public.members_certificates;
DROP POLICY IF EXISTS "Allow all operations on client_documents" ON public.members_client_documents;
DROP POLICY IF EXISTS "Allow all operations on community_comments" ON public.members_community_comments;
DROP POLICY IF EXISTS "Allow all operations on community_likes" ON public.members_community_likes;
DROP POLICY IF EXISTS "Allow all operations on community_posts" ON public.members_community_posts;
DROP POLICY IF EXISTS "Allow all operations on course_progress" ON public.members_course_progress;
DROP POLICY IF EXISTS "Allow all operations on digital_downloads" ON public.members_digital_downloads;
DROP POLICY IF EXISTS "Allow all operations on product_licenses" ON public.members_product_licenses;
DROP POLICY IF EXISTS "Allow all operations on support_tickets" ON public.members_support_tickets;

DROP POLICY IF EXISTS "Authenticated can read feature_overrides" ON public.feature_overrides;
DROP POLICY IF EXISTS "Public can view briefings" ON public.briefings;

DROP POLICY IF EXISTS "Public can view flows" ON public.chatbot_flows;
CREATE POLICY "Public can view flows of active chatbots" ON public.chatbot_flows FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.chatbots c WHERE c.id = chatbot_flows.chatbot_id AND c.is_active = true));

DROP POLICY IF EXISTS "Anyone can view voucher features" ON public.voucher_features;
CREATE POLICY "Authenticated can view voucher features" ON public.voucher_features FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Anyone inserts history" ON public.contract_history;
CREATE POLICY "Anyone inserts history for existing contracts" ON public.contract_history FOR INSERT TO anon, authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.contracts c WHERE c.id = contract_history.contract_id)
              AND event_type IN ('viewed','client_signed'));

DROP POLICY IF EXISTS "Public can create payments" ON public.agent_payments;
CREATE POLICY "Public can create pending payments for existing agents" ON public.agent_payments FOR INSERT TO anon, authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.ai_agents a WHERE a.id = agent_payments.agent_id)
              AND coalesce(status,'pending') = 'pending');

DROP POLICY IF EXISTS "Authenticated users can delete cloned-pages files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update cloned-pages files" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem atualizar suas logos" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem deletar suas logos" ON storage.objects;
DROP POLICY IF EXISTS "business-logos_auth_delete" ON storage.objects;
DROP POLICY IF EXISTS "business-logos_auth_update" ON storage.objects;
DROP POLICY IF EXISTS "dispatcher-media_auth_delete" ON storage.objects;
DROP POLICY IF EXISTS "dispatcher-media_auth_update" ON storage.objects;
DROP POLICY IF EXISTS "portfolio-images_auth_delete" ON storage.objects;
DROP POLICY IF EXISTS "portfolio-images_auth_update" ON storage.objects;
DROP POLICY IF EXISTS "Permitir atualização pública de imagens" ON storage.objects;
DROP POLICY IF EXISTS "Permitir exclusão pública de imagens" ON storage.objects;
DROP POLICY IF EXISTS "Permitir exclusão de mídia no chat" ON storage.objects;

CREATE POLICY "Owners can update their files" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id IN ('cloned-pages','briefing-logos','business-logos','dispatcher-media','portfolio-images','chatbot-media')
         AND owner_id = (select auth.uid()::text))
  WITH CHECK (bucket_id IN ('cloned-pages','briefing-logos','business-logos','dispatcher-media','portfolio-images','chatbot-media')
         AND owner_id = (select auth.uid()::text));
CREATE POLICY "Owners can delete their files" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id IN ('cloned-pages','briefing-logos','business-logos','dispatcher-media','portfolio-images','chatbot-media','chat-media')
         AND owner_id = (select auth.uid()::text));