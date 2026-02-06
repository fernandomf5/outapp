-- Criar tabela para cadastro de devedores/contas a receber
-- Este painel é separado e não afeta os cálculos do painel financeiro principal
CREATE TABLE public.financial_debtors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  business_id UUID REFERENCES public.financial_businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  description TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid', 'overdue', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para registrar pagamentos parciais dos devedores
CREATE TABLE public.financial_debtor_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  debtor_id UUID NOT NULL REFERENCES public.financial_debtors(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.financial_debtors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_debtor_payments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para devedores
CREATE POLICY "Users can view their own debtors" 
ON public.financial_debtors FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own debtors" 
ON public.financial_debtors FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own debtors" 
ON public.financial_debtors FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own debtors" 
ON public.financial_debtors FOR DELETE 
USING (auth.uid() = user_id);

-- Políticas RLS para pagamentos de devedores
CREATE POLICY "Users can view debtor payments" 
ON public.financial_debtor_payments FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.financial_debtors 
  WHERE id = debtor_id AND user_id = auth.uid()
));

CREATE POLICY "Users can insert debtor payments" 
ON public.financial_debtor_payments FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.financial_debtors 
  WHERE id = debtor_id AND user_id = auth.uid()
));

CREATE POLICY "Users can update debtor payments" 
ON public.financial_debtor_payments FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.financial_debtors 
  WHERE id = debtor_id AND user_id = auth.uid()
));

CREATE POLICY "Users can delete debtor payments" 
ON public.financial_debtor_payments FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.financial_debtors 
  WHERE id = debtor_id AND user_id = auth.uid()
));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_financial_debtors_updated_at
BEFORE UPDATE ON public.financial_debtors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_financial_debtors_user_id ON public.financial_debtors(user_id);
CREATE INDEX idx_financial_debtors_business_id ON public.financial_debtors(business_id);
CREATE INDEX idx_financial_debtors_status ON public.financial_debtors(status);
CREATE INDEX idx_financial_debtor_payments_debtor_id ON public.financial_debtor_payments(debtor_id);