CREATE OR REPLACE FUNCTION public.admin_purge_user_data(_user_id uuid, _keep_account boolean DEFAULT true)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
  keep_tables text[] := ARRAY['profiles','user_roles'];
  deleted jsonb := '{}'::jsonb;
  cnt bigint;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'user_id is required';
  END IF;

  FOR r IN
    SELECT c.table_name
    FROM information_schema.columns c
    JOIN information_schema.tables t
      ON t.table_schema = c.table_schema
     AND t.table_name = c.table_name
     AND t.table_type = 'BASE TABLE'
    WHERE c.table_schema = 'public'
      AND c.column_name = 'user_id'
    ORDER BY c.table_name
  LOOP
    IF _keep_account AND r.table_name = ANY(keep_tables) THEN
      CONTINUE;
    END IF;

    BEGIN
      EXECUTE format('DELETE FROM public.%I WHERE user_id = $1', r.table_name) USING _user_id;
      GET DIAGNOSTICS cnt = ROW_COUNT;
      IF cnt > 0 THEN
        deleted := deleted || jsonb_build_object(r.table_name, cnt);
      END IF;
    EXCEPTION WHEN others THEN
      deleted := deleted || jsonb_build_object(r.table_name, 'error: ' || SQLERRM);
    END;
  END LOOP;

  RETURN deleted;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_purge_user_data(uuid, boolean) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_purge_user_data(uuid, boolean) TO service_role;