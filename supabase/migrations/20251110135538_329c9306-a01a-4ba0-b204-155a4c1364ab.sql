-- Create features and feature_overrides tables with RLS and triggers
-- 1) FEATURES TABLE
CREATE TABLE IF NOT EXISTS public.features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  key TEXT NOT NULL UNIQUE,
  category TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.features ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read active features (for UI visibility), admins manage
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='features' AND policyname='Anyone can view active features'
  ) THEN
    CREATE POLICY "Anyone can view active features"
    ON public.features
    FOR SELECT
    USING (is_active = true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='features' AND policyname='Admins can manage features'
  ) THEN
    CREATE POLICY "Admins can manage features"
    ON public.features
    FOR ALL
    USING (has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- Updated_at trigger
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_features_updated_at'
  ) THEN
    CREATE TRIGGER update_features_updated_at
    BEFORE UPDATE ON public.features
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- 2) FEATURE_OVERRIDES TABLE
CREATE TABLE IF NOT EXISTS public.feature_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key TEXT NOT NULL,
  user_id UUID NULL,
  is_blocked BOOLEAN NOT NULL DEFAULT true,
  message TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_feature_overrides_feature FOREIGN KEY (feature_key) REFERENCES public.features(key) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_feature_overrides_feature_key ON public.feature_overrides(feature_key);
CREATE INDEX IF NOT EXISTS idx_feature_overrides_user_id ON public.feature_overrides(user_id);

ALTER TABLE public.feature_overrides ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='feature_overrides' AND policyname='Admins can view all overrides'
  ) THEN
    CREATE POLICY "Admins can view all overrides"
    ON public.feature_overrides
    FOR SELECT
    USING (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='feature_overrides' AND policyname='Users can view global and own overrides'
  ) THEN
    CREATE POLICY "Users can view global and own overrides"
    ON public.feature_overrides
    FOR SELECT
    USING ((user_id IS NULL) OR (auth.uid() = user_id));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='feature_overrides' AND policyname='Admins can manage overrides'
  ) THEN
    CREATE POLICY "Admins can manage overrides"
    ON public.feature_overrides
    FOR ALL
    USING (has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- Updated_at trigger for overrides
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_feature_overrides_updated_at'
  ) THEN
    CREATE TRIGGER update_feature_overrides_updated_at
    BEFORE UPDATE ON public.feature_overrides
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- 3) Seed common features (idempotent)
INSERT INTO public.features (name, key, category)
VALUES
  ('CRM - Contatos', 'crm_contacts', 'crm'),
  ('Gerenciador de Domínios', 'domain_manager', 'sites'),
  ('Link para WhatsApp', 'whatsapp_link', 'comunicacao'),
  ('Gerador de QRCode', 'qrcode_generator', 'utilitarios'),
  ('Agentes de IA', 'ai_agent', 'ai'),
  ('Link Bio', 'link_bio', 'marketing'),
  ('Clonador de Páginas', 'page_cloner', 'marketing'),
  ('Encurtador de Links', 'link_shortener', 'marketing'),
  ('Sistema de Tickets', 'ticket_system', 'suporte'),
  ('Chatbot Web', 'chatbot_web', 'chatbot'),
  ('Financeiro', 'financial_management', 'gestao'),
  ('Gestão de Equipe', 'team_management', 'gestao'),
  ('Gestão de Anúncios', 'ads_management', 'marketing'),
  ('Organizador de Tarefas', 'task_organizer', 'produtividade'),
  ('Criador de Popups', 'popup_creator', 'marketing'),
  ('Criador de Quizzes', 'quiz_creator', 'marketing'),
  ('Briefing Creator', 'briefing_creator', 'briefing'),
  ('Área de Membros', 'members_area', 'produtos'),
  ('Construtor de Sites', 'website_builder', 'sites')
ON CONFLICT (key) DO NOTHING;