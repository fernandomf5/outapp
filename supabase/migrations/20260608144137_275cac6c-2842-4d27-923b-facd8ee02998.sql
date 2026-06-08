ALTER TABLE public.organization_table_rows ADD COLUMN IF NOT EXISTS row_text_color TEXT;
ALTER TABLE public.organization_table_rows ADD COLUMN IF NOT EXISTS is_bold BOOLEAN DEFAULT false;
ALTER TABLE public.organization_table_cells ADD COLUMN IF NOT EXISTS is_bold BOOLEAN DEFAULT false;