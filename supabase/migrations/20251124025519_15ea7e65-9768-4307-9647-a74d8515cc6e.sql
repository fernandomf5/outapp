-- Criar tabela de negócios financeiros
CREATE TABLE IF NOT EXISTS public.financial_businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  business_type TEXT NOT NULL DEFAULT 'personal', -- 'personal' ou 'company'
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.financial_businesses ENABLE ROW LEVEL SECURITY;

-- Policy para usuários gerenciarem seus próprios negócios
CREATE POLICY "Users can manage their own businesses"
  ON public.financial_businesses
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Adicionar coluna business_id na tabela financial_transactions
ALTER TABLE public.financial_transactions 
ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES public.financial_businesses(id) ON DELETE CASCADE;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_financial_transactions_business_id 
  ON public.financial_transactions(business_id);

-- Adicionar coluna category para categorizar transações
ALTER TABLE public.financial_transactions 
ADD COLUMN IF NOT EXISTS category TEXT;

-- Atualizar ad_clients para remover general_cashbox
ALTER TABLE public.ad_clients 
DROP COLUMN IF EXISTS general_cashbox;

-- Renomear ads_cashbox para cashbox
ALTER TABLE public.ad_clients 
RENAME COLUMN ads_cashbox TO cashbox;