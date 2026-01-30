-- Criar tabela de categorias de leads
CREATE TABLE public.lead_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de relação lead-categoria (para armazenar categoria de leads de várias fontes)
CREATE TABLE public.lead_category_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category_id UUID NOT NULL REFERENCES public.lead_categories(id) ON DELETE CASCADE,
  lead_source TEXT NOT NULL, -- 'customers', 'chatbot_conversations', 'agent_customers', 'cloned_page_leads'
  lead_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(lead_source, lead_id)
);

-- Enable RLS
ALTER TABLE public.lead_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_category_assignments ENABLE ROW LEVEL SECURITY;

-- Policies para lead_categories
CREATE POLICY "Users can view their own lead categories" 
ON public.lead_categories 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own lead categories" 
ON public.lead_categories 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lead categories" 
ON public.lead_categories 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lead categories" 
ON public.lead_categories 
FOR DELETE 
USING (auth.uid() = user_id);

-- Policies para lead_category_assignments
CREATE POLICY "Users can view their own lead category assignments" 
ON public.lead_category_assignments 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own lead category assignments" 
ON public.lead_category_assignments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lead category assignments" 
ON public.lead_category_assignments 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lead category assignments" 
ON public.lead_category_assignments 
FOR DELETE 
USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_lead_categories_updated_at
BEFORE UPDATE ON public.lead_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();