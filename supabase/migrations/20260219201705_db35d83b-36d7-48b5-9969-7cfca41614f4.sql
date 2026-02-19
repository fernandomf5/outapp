
-- Table to store monthly cashbox balance per business
CREATE TABLE public.financial_cashbox (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  business_id UUID NOT NULL REFERENCES public.financial_businesses(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  year INTEGER NOT NULL,
  initial_balance NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, business_id, month, year)
);

-- Enable RLS
ALTER TABLE public.financial_cashbox ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own cashbox" ON public.financial_cashbox FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cashbox" ON public.financial_cashbox FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cashbox" ON public.financial_cashbox FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own cashbox" ON public.financial_cashbox FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_financial_cashbox_updated_at
  BEFORE UPDATE ON public.financial_cashbox
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
