-- Tabela de pop-ups
CREATE TABLE IF NOT EXISTS public.popups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  button_text TEXT NOT NULL,
  button_link TEXT,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('time_delay', 'scroll', 'exit_intent', 'manual')),
  delay_seconds INTEGER,
  scroll_percentage INTEGER,
  position TEXT NOT NULL CHECK (position IN ('center', 'bottom_right', 'bottom_left', 'top_right', 'top_left')) DEFAULT 'center',
  is_active BOOLEAN NOT NULL DEFAULT true,
  views INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.popups ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança para popups
CREATE POLICY "Users can manage their own popups"
ON public.popups
FOR ALL
USING (auth.uid() = user_id);

-- Índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_popups_user_id ON public.popups(user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_popups_updated_at BEFORE UPDATE ON public.popups
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column_trigger();
