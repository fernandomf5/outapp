CREATE OR REPLACE FUNCTION public.admin_cleanup_storage_objects(_bucket text, _older_than interval)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  v_count integer;
BEGIN
  PERFORM set_config('storage.allow_delete_query', 'true', true);
  DELETE FROM storage.objects
  WHERE bucket_id = _bucket
    AND created_at < now() - _older_than;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_cleanup_storage_objects(text, interval) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_cleanup_storage_objects(text, interval) TO service_role;