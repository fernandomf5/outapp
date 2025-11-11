-- Adicionar coluna business_name e business_type na tabela financial_transactions
ALTER TABLE public.financial_transactions 
ADD COLUMN IF NOT EXISTS business_name TEXT,
ADD COLUMN IF NOT EXISTS business_type TEXT CHECK (business_type IN ('personal', 'company')) DEFAULT 'personal';

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_financial_transactions_business_name ON public.financial_transactions(business_name);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_business_type ON public.financial_transactions(business_type);