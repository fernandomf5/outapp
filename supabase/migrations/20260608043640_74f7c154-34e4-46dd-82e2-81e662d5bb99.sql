-- Create organization_tables table
CREATE TABLE public.organization_tables (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#3b82f6',
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create organization_table_columns table
CREATE TABLE public.organization_table_columns (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    table_id UUID NOT NULL REFERENCES public.organization_tables(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'text', -- text, number, date, select, status, currency
    options JSONB, -- For select or status types: [{label, color}]
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create organization_table_rows table
CREATE TABLE public.organization_table_rows (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    table_id UUID NOT NULL REFERENCES public.organization_tables(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create organization_table_cells table
CREATE TABLE public.organization_table_cells (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    row_id UUID NOT NULL REFERENCES public.organization_table_rows(id) ON DELETE CASCADE,
    column_id UUID NOT NULL REFERENCES public.organization_table_columns(id) ON DELETE CASCADE,
    value TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.organization_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_table_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_table_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_table_cells ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_tables TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_table_columns TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_table_rows TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_table_cells TO authenticated;
GRANT ALL ON public.organization_tables TO service_role;
GRANT ALL ON public.organization_table_columns TO service_role;
GRANT ALL ON public.organization_table_rows TO service_role;
GRANT ALL ON public.organization_table_cells TO service_role;

-- Policies for organization_tables
CREATE POLICY "Users can manage their own organization tables" 
ON public.organization_tables FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Policies for organization_table_columns
CREATE POLICY "Users can manage columns of their tables" 
ON public.organization_table_columns FOR ALL 
USING (EXISTS (
    SELECT 1 FROM public.organization_tables 
    WHERE id = table_id AND user_id = auth.uid()
));

-- Policies for organization_table_rows
CREATE POLICY "Users can manage rows of their tables" 
ON public.organization_table_rows FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Policies for organization_table_cells
CREATE POLICY "Users can manage cells of their rows" 
ON public.organization_table_cells FOR ALL 
USING (EXISTS (
    SELECT 1 FROM public.organization_table_rows 
    WHERE id = row_id AND user_id = auth.uid()
));

-- Function to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_organization_tables_updated_at 
BEFORE UPDATE ON public.organization_tables 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organization_table_rows_updated_at 
BEFORE UPDATE ON public.organization_table_rows 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organization_table_cells_updated_at 
BEFORE UPDATE ON public.organization_table_cells 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
