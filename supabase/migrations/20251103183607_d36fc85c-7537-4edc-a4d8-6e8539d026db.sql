-- Adicionar campo is_banned à tabela profiles para bloquear usuários
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false;

-- Criar índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_profiles_is_banned ON profiles(is_banned);

-- Adicionar coluna checkout_banner_url às configurações do site (caso não exista)
INSERT INTO site_settings (key, value)
VALUES ('checkout_banner_url', '')
ON CONFLICT (key) DO NOTHING;