CREATE OR REPLACE FUNCTION public.__lov_bootstrap_exec(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

REVOKE ALL ON FUNCTION public.__lov_bootstrap_exec(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.__lov_bootstrap_exec(text) TO sandbox_exec;