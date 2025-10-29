-- Adicionar tabelas para serviços do chatbot e música do link na bio

-- Tabela de serviços do chatbot
CREATE TABLE IF NOT EXISTS chatbot_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id UUID NOT NULL REFERENCES chatbots(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  is_active BOOLEAN NOT NULL DEFAULT true,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS para chatbot_services
ALTER TABLE chatbot_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage services for their chatbots"
ON chatbot_services
FOR ALL
USING (
  chatbot_id IN (
    SELECT id FROM chatbots WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Public can view active services"
ON chatbot_services
FOR SELECT
USING (is_active = true);

-- Adicionar colunas de música no link_bios
ALTER TABLE link_bios ADD COLUMN IF NOT EXISTS music_url TEXT;
ALTER TABLE link_bios ADD COLUMN IF NOT EXISTS music_autoplay BOOLEAN DEFAULT false;

-- Remover coluna de custom_domain (vamos exibir baseado em username)
-- Não vamos realmente remover para não perder dados existentes, só vamos ignorar no código