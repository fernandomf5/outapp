CREATE OR REPLACE FUNCTION public.__lov_bootstrap_exec(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  EXECUTE sql;
END;
$$;