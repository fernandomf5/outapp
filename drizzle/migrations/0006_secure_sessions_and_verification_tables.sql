ALTER TABLE public.team_member_sessions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.team_member_sessions FROM anon, authenticated;
GRANT ALL ON public.team_member_sessions TO service_role;

REVOKE ALL ON public.chatbot_customer_verification_codes FROM anon, authenticated;
GRANT ALL ON public.chatbot_customer_verification_codes TO service_role;