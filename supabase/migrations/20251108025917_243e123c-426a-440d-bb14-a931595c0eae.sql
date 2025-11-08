-- Adicionar novos campos à tabela members_areas para torná-la mais robusta
ALTER TABLE members_areas
ADD COLUMN IF NOT EXISTS area_type TEXT DEFAULT 'course',
ADD COLUMN IF NOT EXISTS require_approval BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS welcome_message TEXT,
ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#8B5CF6',
ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#EC4899',
ADD COLUMN IF NOT EXISTS theme_mode TEXT DEFAULT 'light';

-- Criar tabela de inscritos/membros da área
CREATE TABLE IF NOT EXISTS members_area_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  members_area_id UUID NOT NULL REFERENCES members_areas(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  user_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  payment_status TEXT DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_members_area_subscriptions_area ON members_area_subscriptions(members_area_id);
CREATE INDEX IF NOT EXISTS idx_members_area_subscriptions_email ON members_area_subscriptions(user_email);
CREATE INDEX IF NOT EXISTS idx_members_area_subscriptions_status ON members_area_subscriptions(status);

-- Enable RLS
ALTER TABLE members_area_subscriptions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para members_area_subscriptions
CREATE POLICY "Owners can manage subscriptions"
  ON members_area_subscriptions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM members_areas ma
      WHERE ma.id = members_area_subscriptions.members_area_id
      AND ma.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own subscriptions"
  ON members_area_subscriptions
  FOR SELECT
  USING (user_email = (SELECT email FROM profiles WHERE user_id = auth.uid()));

-- Criar tabela de progresso dos módulos
CREATE TABLE IF NOT EXISTS members_area_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES members_area_subscriptions(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES members_area_modules(id) ON DELETE CASCADE,
  progress_percentage INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(subscription_id, module_id)
);

-- Índices para progresso
CREATE INDEX IF NOT EXISTS idx_members_area_progress_subscription ON members_area_progress(subscription_id);
CREATE INDEX IF NOT EXISTS idx_members_area_progress_module ON members_area_progress(module_id);

-- Enable RLS
ALTER TABLE members_area_progress ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para progresso
CREATE POLICY "Users can view their own progress"
  ON members_area_progress
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM members_area_subscriptions mas
      WHERE mas.id = members_area_progress.subscription_id
      AND mas.user_email = (SELECT email FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can update their own progress"
  ON members_area_progress
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM members_area_subscriptions mas
      WHERE mas.id = members_area_progress.subscription_id
      AND mas.user_email = (SELECT email FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can modify their own progress"
  ON members_area_progress
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM members_area_subscriptions mas
      WHERE mas.id = members_area_progress.subscription_id
      AND mas.user_email = (SELECT email FROM profiles WHERE user_id = auth.uid())
    )
  );

-- Comentários para documentação
COMMENT ON TABLE members_area_subscriptions IS 'Gerencia inscrições de usuários em áreas de membros';
COMMENT ON TABLE members_area_progress IS 'Rastreia o progresso de usuários em módulos da área de membros';
COMMENT ON COLUMN members_areas.area_type IS 'Tipo da área: course, clients, community, membership';
COMMENT ON COLUMN members_areas.require_approval IS 'Se true, requer aprovação manual para novos membros';