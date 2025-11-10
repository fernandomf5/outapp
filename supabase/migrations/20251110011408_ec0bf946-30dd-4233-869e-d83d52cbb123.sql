-- Create feature_overrides table for global and per-user feature gating
CREATE TABLE IF NOT EXISTS public.feature_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key TEXT NOT NULL,
  user_id UUID NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_blocked BOOLEAN NOT NULL DEFAULT true,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure at most one global override per feature
CREATE UNIQUE INDEX IF NOT EXISTS idx_feature_overrides_global_unique
ON public.feature_overrides (feature_key)
WHERE user_id IS NULL;

-- Ensure at most one per-user override per feature
CREATE UNIQUE INDEX IF NOT EXISTS idx_feature_overrides_user_unique
ON public.feature_overrides (feature_key, user_id)
WHERE user_id IS NOT NULL;

-- Enable RLS
ALTER TABLE public.feature_overrides ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$
BEGIN
  -- Allow authenticated users to read overrides
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'feature_overrides' AND policyname = 'Authenticated can read feature_overrides'
  ) THEN
    CREATE POLICY "Authenticated can read feature_overrides"
    ON public.feature_overrides
    FOR SELECT
    TO authenticated
    USING (true);
  END IF;

  -- Allow only admins to insert
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'feature_overrides' AND policyname = 'Admins can insert feature_overrides'
  ) THEN
    CREATE POLICY "Admins can insert feature_overrides"
    ON public.feature_overrides
    FOR INSERT
    TO authenticated
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;

  -- Allow only admins to update
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'feature_overrides' AND policyname = 'Admins can update feature_overrides'
  ) THEN
    CREATE POLICY "Admins can update feature_overrides"
    ON public.feature_overrides
    FOR UPDATE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;

  -- Allow only admins to delete
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'feature_overrides' AND policyname = 'Admins can delete feature_overrides'
  ) THEN
    CREATE POLICY "Admins can delete feature_overrides"
    ON public.feature_overrides
    FOR DELETE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;