-- Criar tabela de anotações rápidas
CREATE TABLE IF NOT EXISTS public.quick_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  reminder_date TIMESTAMP WITH TIME ZONE,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quick_notes ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Users can manage their own notes"
ON public.quick_notes
FOR ALL
USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_quick_notes_updated_at
BEFORE UPDATE ON public.quick_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();