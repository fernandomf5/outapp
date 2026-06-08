CREATE TABLE IF NOT EXISTS public.custom_financial_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  structure_id UUID NOT NULL REFERENCES public.custom_financial_structures(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.custom_financial_field_values (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  record_id UUID NOT NULL REFERENCES public.custom_financial_records(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES public.custom_financial_fields(id) ON DELETE CASCADE,
  value TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.custom_financial_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  record_id UUID NOT NULL REFERENCES public.custom_financial_records(id) ON DELETE CASCADE,
  description TEXT,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, paid, overdue, cancelled
  entry_type TEXT NOT NULL DEFAULT 'income', -- income, expense
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Permissões
GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_financial_records TO authenticated;
GRANT ALL ON public.custom_financial_records TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_financial_field_values TO authenticated;
GRANT ALL ON public.custom_financial_field_values TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_financial_entries TO authenticated;
GRANT ALL ON public.custom_financial_entries TO service_role;

-- RLS
ALTER TABLE public.custom_financial_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_financial_field_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_financial_entries ENABLE ROW LEVEL SECURITY;

-- Políticas (Simplificadas: quem tem acesso à estrutura tem acesso aos registros)
CREATE POLICY "Users can manage records of their structures" ON public.custom_financial_records
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.custom_financial_structures s
    WHERE s.id = custom_financial_records.structure_id
    AND s.user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage field values of their records" ON public.custom_financial_field_values
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.custom_financial_records r
    JOIN public.custom_financial_structures s ON s.id = r.structure_id
    WHERE r.id = custom_financial_field_values.record_id
    AND s.user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage entries of their records" ON public.custom_financial_entries
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.custom_financial_records r
    JOIN public.custom_financial_structures s ON s.id = r.structure_id
    WHERE r.id = custom_financial_entries.record_id
    AND s.user_id = auth.uid()
  )
);
