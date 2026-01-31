-- Tabela de itens de rotina (atividades por dia da semana)
CREATE TABLE public.routine_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME,
  end_time TIME,
  color TEXT DEFAULT '#3b82f6',
  is_recurring BOOLEAN DEFAULT true,
  reminder_minutes INTEGER,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de objetivos (semanais e diários)
CREATE TABLE public.routine_objectives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  objective_type TEXT NOT NULL DEFAULT 'weekly' CHECK (objective_type IN ('weekly', 'daily')),
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
  target_value INTEGER DEFAULT 1,
  current_value INTEGER DEFAULT 0,
  color TEXT DEFAULT '#10b981',
  week_start DATE,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de histórico de completude (para estatísticas)
CREATE TABLE public.routine_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  routine_item_id UUID REFERENCES public.routine_items(id) ON DELETE CASCADE,
  objective_id UUID REFERENCES public.routine_objectives(id) ON DELETE CASCADE,
  completion_date DATE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.routine_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_completions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for routine_items
CREATE POLICY "Users can view their own routine items" ON public.routine_items
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own routine items" ON public.routine_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own routine items" ON public.routine_items
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own routine items" ON public.routine_items
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for routine_objectives
CREATE POLICY "Users can view their own objectives" ON public.routine_objectives
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own objectives" ON public.routine_objectives
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own objectives" ON public.routine_objectives
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own objectives" ON public.routine_objectives
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for routine_completions
CREATE POLICY "Users can view their own completions" ON public.routine_completions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own completions" ON public.routine_completions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own completions" ON public.routine_completions
  FOR DELETE USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_routine_items_updated_at
  BEFORE UPDATE ON public.routine_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_routine_objectives_updated_at
  BEFORE UPDATE ON public.routine_objectives
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();