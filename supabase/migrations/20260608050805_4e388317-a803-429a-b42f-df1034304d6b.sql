ALTER TABLE public.organization_table_columns ADD COLUMN IF NOT EXISTS header_text_color TEXT DEFAULT '#000000';
ALTER TABLE public.organization_table_rows ADD COLUMN IF NOT EXISTS row_background_color TEXT;
ALTER TABLE public.organization_table_rows ADD COLUMN IF NOT EXISTS border_color TEXT;
