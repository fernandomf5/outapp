ALTER TABLE public.organization_table_cells ADD COLUMN IF NOT EXISTS text_color TEXT;

-- Garantir que a service_role tenha acesso total
GRANT ALL ON public.organization_table_cells TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_table_cells TO authenticated;
