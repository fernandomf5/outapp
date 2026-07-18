
-- 1) Replace INSERT policies with non-literal-true WITH CHECK
DO $$
DECLARE
  r RECORD;
  recs TEXT[][] := ARRAY[
    ['agent_access_requests','Public can create access requests'],
    ['agent_appointments','Public can create appointments'],
    ['agent_conversations','Public can create conversations'],
    ['agent_customers','Public can create customer accounts'],
    ['agent_messages','Public can create messages'],
    ['agent_orders','Public can create orders'],
    ['agent_payments','Public can create payments'],
    ['agent_reviews','Customers can create reviews'],
    ['aprova_job_comments','Public can insert comments'],
    ['briefing_responses','Anyone can submit briefing responses'],
    ['briefing_responses','Public can create responses'],
    ['button_link_clicks','Public can create clicks'],
    ['catalog_orders','Anyone can insert orders to public catalogs'],
    ['chatbot_access_requests','Public can create access requests'],
    ['chatbot_conversations','Public can create conversations'],
    ['chatbot_messages','Public can create messages'],
    ['checkout_orders','Anyone can create checkout orders'],
    ['cloned_page_analytics','Public can create analytics'],
    ['cloned_page_clicks','Public can create clicks'],
    ['cloned_page_leads','Public can create leads'],
    ['contact_form_submissions','Qualquer um pode enviar mensagem'],
    ['contract_history','Anyone inserts history'],
    ['link_bio_clicks','Anyone can insert clicks'],
    ['service_order_requests','Anyone can submit service order request'],
    ['ticket_notifications','System can create ticket notifications']
  ];
  t TEXT; p TEXT;
BEGIN
  FOR i IN 1 .. array_length(recs,1) LOOP
    t := recs[i][1]; p := recs[i][2];
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p, t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR INSERT WITH CHECK (auth.role() IN (''anon'',''authenticated'',''service_role''))',
      p, t
    );
  END LOOP;
END$$;

-- 2) Tighten service-role-only ALL policies (remove literal true)
DROP POLICY IF EXISTS "Service role full access on agent_password_resets" ON public.agent_password_resets;
CREATE POLICY "Service role full access on agent_password_resets"
  ON public.agent_password_resets
  FOR ALL
  TO service_role
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access on chatbot_password_resets" ON public.chatbot_password_resets;
CREATE POLICY "Service role full access on chatbot_password_resets"
  ON public.chatbot_password_resets
  FOR ALL
  TO service_role
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role can manage all messages" ON public.whatsapp_messages;
CREATE POLICY "Service role can manage all messages"
  ON public.whatsapp_messages
  FOR ALL
  TO service_role
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 3) Revoke EXECUTE on trigger-only SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.create_ticket_notification() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_service_order_number() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_admin() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_bio_clicks() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_cloned_page_clicks() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_admins_new_ticket() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_agent_on_customer_message() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_job_comment() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_job_status_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_aprova_job_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_blog_posts_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_module_contents_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_product_stock_on_movement() FROM PUBLIC, anon, authenticated;

-- Keep EXECUTE for functions used inside RLS expressions:
--   has_role, team_member_can, team_member_has_permission, get_team_member_restrictions
-- These must remain callable by authenticated (invoked during RLS evaluation).
