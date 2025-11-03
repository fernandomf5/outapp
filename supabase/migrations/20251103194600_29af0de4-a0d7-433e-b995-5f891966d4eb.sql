-- Criar tabelas para área de membros

-- Tabela de áreas de membros
CREATE TABLE IF NOT EXISTS members_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#6366f1',
  is_active BOOLEAN DEFAULT true,
  requires_approval BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de módulos
CREATE TABLE IF NOT EXISTS members_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id UUID NOT NULL REFERENCES members_areas(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de conteúdos
CREATE TABLE IF NOT EXISTS members_contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES members_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('text', 'video', 'pdf', 'image')),
  content_url TEXT,
  content_text TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_free BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies para members_areas
ALTER TABLE members_areas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own areas"
  ON members_areas
  FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies para members_modules
ALTER TABLE members_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage modules for their areas"
  ON members_modules
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM members_areas
      WHERE members_areas.id = members_modules.area_id
      AND members_areas.user_id = auth.uid()
    )
  );

-- RLS Policies para members_contents
ALTER TABLE members_contents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage contents for their modules"
  ON members_contents
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM members_modules
      JOIN members_areas ON members_areas.id = members_modules.area_id
      WHERE members_modules.id = members_contents.module_id
      AND members_areas.user_id = auth.uid()
    )
  );

-- Criar índices para melhor performance
CREATE INDEX idx_members_areas_user_id ON members_areas(user_id);
CREATE INDEX idx_members_modules_area_id ON members_modules(area_id);
CREATE INDEX idx_members_contents_module_id ON members_contents(module_id);