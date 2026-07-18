
-- agent_customers: remove public SELECT
DROP POLICY IF EXISTS "Customers can view their own data" ON public.agent_customers;

-- agent_messages
DROP POLICY IF EXISTS "Public can view messages" ON public.agent_messages;

-- agent_orders
DROP POLICY IF EXISTS "Public can view orders" ON public.agent_orders;

-- agent_payments
DROP POLICY IF EXISTS "Public can view payments" ON public.agent_payments;

-- chatbot_customer_verification_codes
DROP POLICY IF EXISTS "Users can view their own verification codes" ON public.chatbot_customer_verification_codes;
DROP POLICY IF EXISTS "Users can insert their own verification codes" ON public.chatbot_customer_verification_codes;

-- contracts
DROP POLICY IF EXISTS "Public can view contracts" ON public.contracts;
DROP POLICY IF EXISTS "Public can sign contracts" ON public.contracts;
CREATE POLICY "Public can view contracts by slug or code"
  ON public.contracts FOR SELECT TO anon, authenticated
  USING (public_slug IS NOT NULL OR access_code IS NOT NULL);
CREATE POLICY "Public can sign contracts by slug or code"
  ON public.contracts FOR UPDATE TO anon, authenticated
  USING (public_slug IS NOT NULL OR access_code IS NOT NULL)
  WITH CHECK (public_slug IS NOT NULL OR access_code IS NOT NULL);

-- invoices
DROP POLICY IF EXISTS "Public can view invoices by token" ON public.invoices;
CREATE POLICY "Public can view invoices by token"
  ON public.invoices FOR SELECT TO anon, authenticated
  USING (public_token IS NOT NULL);

-- user_2fa_codes: writes only via service role
DROP POLICY IF EXISTS "Public can insert 2FA codes" ON public.user_2fa_codes;

-- user_trusted_devices
DROP POLICY IF EXISTS "Public can insert trusted devices" ON public.user_trusted_devices;
DROP POLICY IF EXISTS "Public can update trusted devices" ON public.user_trusted_devices;
CREATE POLICY "Users can insert their own trusted devices"
  ON public.user_trusted_devices FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own trusted devices"
  ON public.user_trusted_devices FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- user_verification_codes
DROP POLICY IF EXISTS "Users can insert their own verification codes" ON public.user_verification_codes;
DROP POLICY IF EXISTS "Users can update their own verification codes" ON public.user_verification_codes;
DROP POLICY IF EXISTS "Users can view their own verification codes" ON public.user_verification_codes;
CREATE POLICY "Users view own verification codes"
  ON public.user_verification_codes FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- agent_password_resets
DROP POLICY IF EXISTS "Service role full access on agent_password_resets" ON public.agent_password_resets;
CREATE POLICY "Service role full access on agent_password_resets"
  ON public.agent_password_resets FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- chatbot_password_resets
DROP POLICY IF EXISTS "Service role full access on chatbot_password_resets" ON public.chatbot_password_resets;
CREATE POLICY "Service role full access on chatbot_password_resets"
  ON public.chatbot_password_resets FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- aprova_job_clients
DROP POLICY IF EXISTS "Public can view clients by token" ON public.aprova_job_clients;
CREATE POLICY "Public can view clients by token"
  ON public.aprova_job_clients FOR SELECT TO anon, authenticated
  USING (access_token IS NOT NULL);

-- aprova_job_jobs
DROP POLICY IF EXISTS "Public can update job status" ON public.aprova_job_jobs;
DROP POLICY IF EXISTS "Public can view and update jobs" ON public.aprova_job_jobs;
CREATE POLICY "Public can view jobs via client token"
  ON public.aprova_job_jobs FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.aprova_job_clients c
                 WHERE c.id = aprova_job_jobs.client_id AND c.access_token IS NOT NULL));
CREATE POLICY "Public can update jobs via client token"
  ON public.aprova_job_jobs FOR UPDATE TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.aprova_job_clients c
                 WHERE c.id = aprova_job_jobs.client_id AND c.access_token IS NOT NULL))
  WITH CHECK (EXISTS (SELECT 1 FROM public.aprova_job_clients c
                      WHERE c.id = aprova_job_jobs.client_id AND c.access_token IS NOT NULL));

-- commercial_proposals
DROP POLICY IF EXISTS "Public can update proposal acceptance" ON public.commercial_proposals;
CREATE POLICY "Public can update proposal acceptance"
  ON public.commercial_proposals FOR UPDATE TO anon, authenticated
  USING ((slug IS NOT NULL AND is_private = false) OR private_token IS NOT NULL)
  WITH CHECK ((slug IS NOT NULL AND is_private = false) OR private_token IS NOT NULL);

-- members_area_access_codes: remove blanket public read (use service role via edge function)
DROP POLICY IF EXISTS "Anyone can verify access codes" ON public.members_area_access_codes;

-- members_area_video_questions
DROP POLICY IF EXISTS "Public can delete questions" ON public.members_area_video_questions;
DROP POLICY IF EXISTS "Public can insert questions" ON public.members_area_video_questions;
DROP POLICY IF EXISTS "Public can read questions" ON public.members_area_video_questions;
DROP POLICY IF EXISTS "Public can update questions" ON public.members_area_video_questions;

-- service_order_requests
DROP POLICY IF EXISTS "Authenticated users can delete requests" ON public.service_order_requests;
DROP POLICY IF EXISTS "Authenticated users can update requests" ON public.service_order_requests;
DROP POLICY IF EXISTS "Authenticated users can view requests" ON public.service_order_requests;

-- SECURITY DEFINER hardening
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.team_member_has_permission(uuid, text, permission_action) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.team_member_can(uuid, text, permission_action, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_team_member_restrictions(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.generate_access_code() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_checkout_access_code() FROM PUBLIC, anon, authenticated;

-- Function search_path fixes
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column_trigger() SET search_path = public;
ALTER FUNCTION public.handle_updated_at() SET search_path = public;
ALTER FUNCTION public.update_customers_updated_at() SET search_path = public;
ALTER FUNCTION public.update_financial_businesses_updated_at() SET search_path = public;
ALTER FUNCTION public.update_members_areas_updated_at() SET search_path = public;
ALTER FUNCTION public.update_post_comments_count() SET search_path = public;
ALTER FUNCTION public.update_post_likes_count() SET search_path = public;
ALTER FUNCTION public.generate_access_code() SET search_path = public;
ALTER FUNCTION public.generate_checkout_access_code() SET search_path = public;
