DO $$
DECLARE
  t record;
  p record;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t.tablename);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t.tablename);
  END LOOP;

  -- Grant anon only the commands its own policies already allow
  FOR p IN
    SELECT DISTINCT tablename, cmd
    FROM pg_policies
    WHERE schemaname = 'public'
      AND ('anon' = ANY(roles) OR 'public' = ANY(roles))
  LOOP
    IF p.cmd = 'SELECT' THEN
      EXECUTE format('GRANT SELECT ON public.%I TO anon', p.tablename);
    ELSIF p.cmd = 'INSERT' THEN
      EXECUTE format('GRANT INSERT ON public.%I TO anon', p.tablename);
    ELSIF p.cmd = 'UPDATE' THEN
      EXECUTE format('GRANT SELECT, UPDATE ON public.%I TO anon', p.tablename);
    ELSIF p.cmd = 'DELETE' THEN
      EXECUTE format('GRANT DELETE ON public.%I TO anon', p.tablename);
    ELSIF p.cmd = 'ALL' THEN
      EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO anon', p.tablename);
    END IF;
  END LOOP;
END $$;

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;