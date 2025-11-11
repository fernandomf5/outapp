-- Recriar função com search_path correto
DROP TRIGGER IF EXISTS update_module_contents_updated_at ON public.members_area_module_contents;
DROP FUNCTION IF EXISTS update_module_contents_updated_at();

CREATE OR REPLACE FUNCTION update_module_contents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

CREATE TRIGGER update_module_contents_updated_at
BEFORE UPDATE ON public.members_area_module_contents
FOR EACH ROW
EXECUTE FUNCTION update_module_contents_updated_at();