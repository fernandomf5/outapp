-- Adicionar coluna monthly_status para permitir status independentes por mês em transações fixas
ALTER TABLE financial_transactions
ADD COLUMN IF NOT EXISTS monthly_status JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN financial_transactions.monthly_status IS 'Armazena status específico por mês/ano para transações fixas. Formato: {"Janeiro-2024": "paid", "Fevereiro-2024": "pending"}';