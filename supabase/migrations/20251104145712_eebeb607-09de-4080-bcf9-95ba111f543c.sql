-- Ensure RLS and policies for public viewing and admin management of custom pages
DO $$ BEGIN
  -- Enable RLS
  PERFORM 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'custom_pages';
  IF FOUND THEN
    EXECUTE 'ALTER TABLE public.custom_pages ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;

-- Replace existing policies safely
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'custom_pages' AND policyname = 'Public can view active custom pages'
  ) THEN
    EXECUTE 'DROP POLICY "Public can view active custom pages" ON public.custom_pages';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'custom_pages' AND policyname = 'Admins can manage custom pages'
  ) THEN
    EXECUTE 'DROP POLICY "Admins can manage custom pages" ON public.custom_pages';
  END IF;
END $$;

-- Public read policy (active pages only)
CREATE POLICY "Public can view active custom pages"
ON public.custom_pages
FOR SELECT
USING (is_active = true);

-- Admin full manage policy
CREATE POLICY "Admins can manage custom pages"
ON public.custom_pages
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));