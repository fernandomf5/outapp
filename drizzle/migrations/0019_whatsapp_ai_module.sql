CREATE TABLE public.whatsapp_ai_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  provider text NOT NULL CHECK (provider IN ('evolution','meta')),
  status text NOT NULL DEFAULT 'disconnected' CHECK (status IN ('disconnected','connecting','qr_code','connected','error')),
  phone_number text,
  qr_code text,
  last_error text,
  agent_enabled boolean NOT NULL DEFAULT true,
  agent_name text NOT NULL DEFAULT 'Assistente',
  personality text NOT NULL DEFAULT 'Cordial, objetivo e prestativo.',
  system_prompt text NOT NULL DEFAULT 'Você atende clientes pelo WhatsApp. Responda em português do Brasil, com mensagens curtas.',
  rules text NOT NULL DEFAULT '',
  handoff_keywords text[] NOT NULL DEFAULT ARRAY['atendente','humano','falar com pessoa'],
  handoff_message text NOT NULL DEFAULT 'Certo! Vou te transferir para um atendente humano. Aguarde um instante.',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.whatsapp_ai_connections(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_ai_connections TO authenticated;
GRANT ALL ON public.whatsapp_ai_connections TO service_role;
ALTER TABLE public.whatsapp_ai_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.whatsapp_ai_connections FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.whatsapp_ai_connections FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.whatsapp_ai_connections FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.whatsapp_ai_connections FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Credentials: server-only (no client grants)
CREATE TABLE public.whatsapp_ai_credentials (
  connection_id uuid PRIMARY KEY REFERENCES public.whatsapp_ai_connections(id) ON DELETE CASCADE,
  webhook_secret text NOT NULL DEFAULT encode(gen_random_bytes(18),'hex'),
  evolution_base_url text,
  evolution_api_key text,
  evolution_instance text,
  meta_phone_number_id text,
  meta_access_token text,
  meta_verify_token text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.whatsapp_ai_credentials TO service_role;
ALTER TABLE public.whatsapp_ai_credentials ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.whatsapp_ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id uuid NOT NULL REFERENCES public.whatsapp_ai_connections(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_phone text NOT NULL,
  contact_name text,
  mode text NOT NULL DEFAULT 'ai' CHECK (mode IN ('ai','human','closed')),
  last_message_at timestamptz NOT NULL DEFAULT now(),
  last_message_preview text,
  unread_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (connection_id, contact_phone)
);
CREATE INDEX ON public.whatsapp_ai_conversations(user_id, last_message_at DESC);
GRANT SELECT, UPDATE, DELETE ON public.whatsapp_ai_conversations TO authenticated;
GRANT ALL ON public.whatsapp_ai_conversations TO service_role;
ALTER TABLE public.whatsapp_ai_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.whatsapp_ai_conversations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own update" ON public.whatsapp_ai_conversations FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.whatsapp_ai_conversations FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.whatsapp_ai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.whatsapp_ai_conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  direction text NOT NULL CHECK (direction IN ('in','out')),
  sender text NOT NULL CHECK (sender IN ('contact','ai','human','system')),
  content text NOT NULL,
  external_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.whatsapp_ai_messages(conversation_id, created_at);
CREATE UNIQUE INDEX whatsapp_ai_messages_ext ON public.whatsapp_ai_messages(conversation_id, external_id) WHERE external_id IS NOT NULL;
GRANT SELECT ON public.whatsapp_ai_messages TO authenticated;
GRANT ALL ON public.whatsapp_ai_messages TO service_role;
ALTER TABLE public.whatsapp_ai_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.whatsapp_ai_messages FOR SELECT TO authenticated USING (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_ai_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_ai_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_ai_connections;