
CREATE TABLE public.saved_receipts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  receipt_number TEXT NOT NULL,
  receipt_data JSONB NOT NULL,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  client_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own receipts" ON public.saved_receipts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own receipts" ON public.saved_receipts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own receipts" ON public.saved_receipts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own receipts" ON public.saved_receipts FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_saved_receipts_updated_at BEFORE UPDATE ON public.saved_receipts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_saved_receipts_user_id ON public.saved_receipts(user_id);
CREATE INDEX idx_saved_receipts_receipt_number ON public.saved_receipts(receipt_number);
