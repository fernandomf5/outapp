-- Buckets sem políticas de escrita: envios falhavam com "row-level security policy"
DO $$
DECLARE b text;
BEGIN
  FOREACH b IN ARRAY ARRAY['business-logos','portfolio-images','dispatcher-media'] LOOP
    EXECUTE format($f$
      CREATE POLICY %I ON storage.objects FOR SELECT USING (bucket_id = %L);
    $f$, b || '_public_read', b);
    EXECUTE format($f$
      CREATE POLICY %I ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = %L);
    $f$, b || '_auth_insert', b);
    EXECUTE format($f$
      CREATE POLICY %I ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = %L) WITH CHECK (bucket_id = %L);
    $f$, b || '_auth_update', b, b);
    EXECUTE format($f$
      CREATE POLICY %I ON storage.objects FOR DELETE TO authenticated USING (bucket_id = %L);
    $f$, b || '_auth_delete', b);
  END LOOP;
END $$;