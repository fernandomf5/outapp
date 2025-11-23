-- Adicionar novos campos para gestão financeira melhorada
ALTER TABLE financial_transactions
ADD COLUMN IF NOT EXISTS month TEXT,
ADD COLUMN IF NOT EXISTS due_date DATE,
ADD COLUMN IF NOT EXISTS reminder_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS status_history JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE);

-- Tornar o campo date opcional (será usado apenas para registro interno)
ALTER TABLE financial_transactions ALTER COLUMN date DROP NOT NULL;

-- Atualizar registros existentes: popular month e year com base na data existente
UPDATE financial_transactions
SET month = TO_CHAR(date, 'Month'),
    year = EXTRACT(YEAR FROM date)::integer
WHERE month IS NULL AND date IS NOT NULL;

-- Criar índice para melhor performance em consultas por mês/ano
CREATE INDEX IF NOT EXISTS idx_financial_transactions_month_year 
ON financial_transactions(year, month, business_id);