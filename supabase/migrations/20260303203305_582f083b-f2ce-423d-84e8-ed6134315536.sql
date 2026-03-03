
-- Tabela de categorias de scripts
CREATE TABLE public.script_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3b82f6',
  icon TEXT DEFAULT 'folder',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.script_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own script categories"
  ON public.script_categories FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Tabela de scripts/mensagens salvas
CREATE TABLE public.saved_scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  category_id UUID REFERENCES public.script_categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  is_favorite BOOLEAN DEFAULT false,
  use_count INT DEFAULT 0,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.saved_scripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own saved scripts"
  ON public.saved_scripts FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_script_categories_updated_at
  BEFORE UPDATE ON public.script_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_saved_scripts_updated_at
  BEFORE UPDATE ON public.saved_scripts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
