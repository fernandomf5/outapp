-- Criar tabela de negócios financeiros
CREATE TABLE IF NOT EXISTS public.financial_businesses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  business_type TEXT NOT NULL DEFAULT 'personal' CHECK (business_type IN ('personal', 'company')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.financial_businesses ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own businesses"
  ON public.financial_businesses
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own businesses"
  ON public.financial_businesses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own businesses"
  ON public.financial_businesses
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own businesses"
  ON public.financial_businesses
  FOR DELETE
  USING (auth.uid() = user_id);

-- Adicionar business_id à tabela de transações
ALTER TABLE public.financial_transactions
  ADD COLUMN business_id UUID REFERENCES public.financial_businesses(id) ON DELETE CASCADE;

-- Criar índice para melhor performance
CREATE INDEX idx_financial_transactions_business_id ON public.financial_transactions(business_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_financial_businesses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_financial_businesses_updated_at
  BEFORE UPDATE ON public.financial_businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_financial_businesses_updated_at();