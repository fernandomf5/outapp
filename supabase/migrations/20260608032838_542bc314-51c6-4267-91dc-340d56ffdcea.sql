-- Create custom_financial_structures table
CREATE TABLE public.custom_financial_structures (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create custom_financial_fields table (custom schema for each structure)
CREATE TABLE public.custom_financial_fields (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    structure_id UUID NOT NULL REFERENCES public.custom_financial_structures(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    field_type TEXT NOT NULL, -- 'text', 'number', 'date', 'select', 'boolean', 'email', 'tel'
    options JSONB, -- For 'select' type
    is_required BOOLEAN DEFAULT false,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create custom_financial_records table (the actual entities, e.g., a specific client)
CREATE TABLE public.custom_financial_records (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    structure_id UUID NOT NULL REFERENCES public.custom_financial_structures(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- Primary display name
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create custom_financial_field_values table
CREATE TABLE public.custom_financial_field_values (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    record_id UUID NOT NULL REFERENCES public.custom_financial_records(id) ON DELETE CASCADE,
    field_id UUID NOT NULL REFERENCES public.custom_financial_fields(id) ON DELETE CASCADE,
    value TEXT, -- Store all as text, cast in app
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(record_id, field_id)
);

-- Create custom_financial_entries table (financial ledger for these records)
CREATE TABLE public.custom_financial_entries (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    record_id UUID NOT NULL REFERENCES public.custom_financial_records(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    entry_type TEXT NOT NULL, -- 'income' (receber), 'expense' (pagar)
    status TEXT NOT NULL DEFAULT 'pending', -- 'paid', 'pending', 'upcoming', 'overdue', 'cancelled', 'negotiating'
    due_date DATE NOT NULL,
    payment_date DATE,
    is_recurring BOOLEAN DEFAULT false,
    recurring_period TEXT, -- 'monthly', 'weekly', 'yearly'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- GRANTs
GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_financial_structures TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_financial_fields TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_financial_records TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_financial_field_values TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_financial_entries TO authenticated;

GRANT ALL ON public.custom_financial_structures TO service_role;
GRANT ALL ON public.custom_financial_fields TO service_role;
GRANT ALL ON public.custom_financial_records TO service_role;
GRANT ALL ON public.custom_financial_field_values TO service_role;
GRANT ALL ON public.custom_financial_entries TO service_role;

-- Enable RLS
ALTER TABLE public.custom_financial_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_financial_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_financial_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_financial_field_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_financial_entries ENABLE ROW LEVEL SECURITY;

-- Policies for structures
CREATE POLICY "Users can manage their own financial structures" 
ON public.custom_financial_structures FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Policies for fields (linked via structure)
CREATE POLICY "Users can manage fields of their own structures" 
ON public.custom_financial_fields FOR ALL 
USING (EXISTS (
    SELECT 1 FROM public.custom_financial_structures s 
    WHERE s.id = custom_financial_fields.structure_id AND s.user_id = auth.uid()
))
WITH CHECK (EXISTS (
    SELECT 1 FROM public.custom_financial_structures s 
    WHERE s.id = custom_financial_fields.structure_id AND s.user_id = auth.uid()
));

-- Policies for records
CREATE POLICY "Users can manage their own records" 
ON public.custom_financial_records FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Policies for field values
CREATE POLICY "Users can manage values of their own records" 
ON public.custom_financial_field_values FOR ALL 
USING (EXISTS (
    SELECT 1 FROM public.custom_financial_records r 
    WHERE r.id = custom_financial_field_values.record_id AND r.user_id = auth.uid()
))
WITH CHECK (EXISTS (
    SELECT 1 FROM public.custom_financial_records r 
    WHERE r.id = custom_financial_field_values.record_id AND r.user_id = auth.uid()
));

-- Policies for entries
CREATE POLICY "Users can manage their own financial entries" 
ON public.custom_financial_entries FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Updated_at triggers
CREATE OR REPLACE FUNCTION public.handle_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_custom_financial_structures_updated_at BEFORE UPDATE ON public.custom_financial_structures FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER tr_custom_financial_records_updated_at BEFORE UPDATE ON public.custom_financial_records FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER tr_custom_financial_field_values_updated_at BEFORE UPDATE ON public.custom_financial_field_values FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER tr_custom_financial_entries_updated_at BEFORE UPDATE ON public.custom_financial_entries FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
