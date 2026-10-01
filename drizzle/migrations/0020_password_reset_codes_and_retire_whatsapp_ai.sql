COMMENT ON TABLE public.whatsapp_ai_messages IS 'DEPRECATED: WhatsApp com Agente IA removido da plataforma';
COMMENT ON TABLE public.whatsapp_ai_conversations IS 'DEPRECATED: WhatsApp com Agente IA removido da plataforma';
COMMENT ON TABLE public.whatsapp_ai_credentials IS 'DEPRECATED: WhatsApp com Agente IA removido da plataforma';
COMMENT ON TABLE public.whatsapp_ai_connections IS 'DEPRECATED: WhatsApp com Agente IA removido da plataforma';

CREATE TABLE IF NOT EXISTS public.user_password_reset_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  code text NOT NULL,
  expires_at timestamptz NOT NULL,
  used boolean NOT NULL DEFAULT false,
  attempts integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.user_password_reset_codes TO service_role;
ALTER TABLE public.user_password_reset_codes ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_user_password_reset_codes_user ON public.user_password_reset_codes(user_id, created_at DESC);