-- Create sales_funnels table
CREATE TABLE public.sales_funnels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3b82f6',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create funnel_stages table
CREATE TABLE public.funnel_stages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  funnel_id UUID NOT NULL REFERENCES public.sales_funnels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6b7280',
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create funnel_leads table
CREATE TABLE public.funnel_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  funnel_id UUID NOT NULL REFERENCES public.sales_funnels(id) ON DELETE CASCADE,
  stage_id UUID NOT NULL REFERENCES public.funnel_stages(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  value DECIMAL(12,2) DEFAULT 0,
  notes TEXT,
  tags TEXT[],
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  expected_close_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create funnel_lead_history table for tracking movements
CREATE TABLE public.funnel_lead_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.funnel_leads(id) ON DELETE CASCADE,
  from_stage_id UUID REFERENCES public.funnel_stages(id) ON DELETE SET NULL,
  to_stage_id UUID NOT NULL REFERENCES public.funnel_stages(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sales_funnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnel_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnel_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnel_lead_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sales_funnels
CREATE POLICY "Users can view their own funnels" ON public.sales_funnels
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own funnels" ON public.sales_funnels
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own funnels" ON public.sales_funnels
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own funnels" ON public.sales_funnels
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for funnel_stages
CREATE POLICY "Users can view stages of their funnels" ON public.funnel_stages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.sales_funnels WHERE id = funnel_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can create stages in their funnels" ON public.funnel_stages
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.sales_funnels WHERE id = funnel_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can update stages in their funnels" ON public.funnel_stages
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.sales_funnels WHERE id = funnel_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can delete stages in their funnels" ON public.funnel_stages
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.sales_funnels WHERE id = funnel_id AND user_id = auth.uid())
  );

-- RLS Policies for funnel_leads
CREATE POLICY "Users can view leads in their funnels" ON public.funnel_leads
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.sales_funnels WHERE id = funnel_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can create leads in their funnels" ON public.funnel_leads
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.sales_funnels WHERE id = funnel_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can update leads in their funnels" ON public.funnel_leads
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.sales_funnels WHERE id = funnel_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can delete leads in their funnels" ON public.funnel_leads
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.sales_funnels WHERE id = funnel_id AND user_id = auth.uid())
  );

-- RLS Policies for funnel_lead_history
CREATE POLICY "Users can view history of their leads" ON public.funnel_lead_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.funnel_leads fl 
      JOIN public.sales_funnels sf ON fl.funnel_id = sf.id 
      WHERE fl.id = lead_id AND sf.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create history for their leads" ON public.funnel_lead_history
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.funnel_leads fl 
      JOIN public.sales_funnels sf ON fl.funnel_id = sf.id 
      WHERE fl.id = lead_id AND sf.user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX idx_funnel_stages_funnel_id ON public.funnel_stages(funnel_id);
CREATE INDEX idx_funnel_stages_order ON public.funnel_stages(funnel_id, order_index);
CREATE INDEX idx_funnel_leads_funnel_id ON public.funnel_leads(funnel_id);
CREATE INDEX idx_funnel_leads_stage_id ON public.funnel_leads(stage_id);
CREATE INDEX idx_funnel_lead_history_lead_id ON public.funnel_lead_history(lead_id);

-- Create trigger for updated_at
CREATE TRIGGER update_sales_funnels_updated_at
  BEFORE UPDATE ON public.sales_funnels
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_funnel_stages_updated_at
  BEFORE UPDATE ON public.funnel_stages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_funnel_leads_updated_at
  BEFORE UPDATE ON public.funnel_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();