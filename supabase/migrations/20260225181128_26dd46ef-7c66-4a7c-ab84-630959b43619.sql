
CREATE TABLE public.receipt_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  company_name TEXT,
  company_document TEXT,
  company_address TEXT,
  company_phone TEXT,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#2563eb',
  receipt_title TEXT DEFAULT 'RECIBO',
  issuer_signer_name TEXT,
  warranty_text TEXT,
  terms_text TEXT,
  notes_template TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.receipt_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own receipt templates"
  ON public.receipt_templates FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_receipt_templates_updated_at
  BEFORE UPDATE ON public.receipt_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
