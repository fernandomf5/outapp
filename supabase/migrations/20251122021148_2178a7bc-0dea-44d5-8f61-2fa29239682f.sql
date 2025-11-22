-- Criar tabela para área de membros simplificada
CREATE TABLE IF NOT EXISTS public.simple_members_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  password TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  sections JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.simple_members_areas ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own areas"
  ON public.simple_members_areas
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Public can view active areas with password"
  ON public.simple_members_areas
  FOR SELECT
  USING (is_active = true);