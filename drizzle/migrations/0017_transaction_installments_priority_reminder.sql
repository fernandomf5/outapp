ALTER TABLE public.financial_transactions
  ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS reminder_days_before INTEGER,
  ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS installment_number INTEGER,
  ADD COLUMN IF NOT EXISTS installment_total INTEGER,
  ADD COLUMN IF NOT EXISTS installment_group_id UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'financial_transactions_priority_check'
  ) THEN
    ALTER TABLE public.financial_transactions
      ADD CONSTRAINT financial_transactions_priority_check
      CHECK (priority IN ('normal', 'alta', 'urgente'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_financial_transactions_installment_group
  ON public.financial_transactions (installment_group_id);

CREATE INDEX IF NOT EXISTS idx_financial_transactions_reminder
  ON public.financial_transactions (due_date)
  WHERE reminder_days_before IS NOT NULL AND reminder_sent = false;