-- Create financial_bank_accounts table
CREATE TABLE IF NOT EXISTS public.financial_bank_accounts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    business_id UUID REFERENCES public.financial_businesses(id) ON DELETE SET NULL,
    bank_name TEXT NOT NULL,
    account_type TEXT NOT NULL CHECK (account_type IN ('PF', 'PJ')),
    current_balance DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    agency TEXT,
    account_number TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Grant access
GRANT SELECT, INSERT, UPDATE, DELETE ON public.financial_bank_accounts TO authenticated;
GRANT ALL ON public.financial_bank_accounts TO service_role;

-- Enable RLS
ALTER TABLE public.financial_bank_accounts ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Users can manage their own bank accounts" 
ON public.financial_bank_accounts FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column() 
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_financial_bank_accounts_updated_at 
BEFORE UPDATE ON public.financial_bank_accounts 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add bank_account_id to financial_transactions
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'financial_transactions' AND COLUMN_NAME = 'bank_account_id'
    ) THEN
        ALTER TABLE public.financial_transactions ADD COLUMN bank_account_id UUID REFERENCES public.financial_bank_accounts(id) ON DELETE SET NULL;
    END IF;
END $$;