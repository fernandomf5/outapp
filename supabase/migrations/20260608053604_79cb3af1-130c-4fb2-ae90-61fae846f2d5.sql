ALTER TABLE public.organization_table_rows ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_table_rows TO authenticated;
GRANT ALL ON public.organization_table_rows TO service_role;
