-- Members Areas: add richer typing and settings
ALTER TABLE public.members_areas
  ADD COLUMN IF NOT EXISTS area_type TEXT NOT NULL DEFAULT 'course',
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS banner_url TEXT,
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS custom_domain TEXT,
  ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;

-- Modules: additional metadata
ALTER TABLE public.members_area_modules
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS content_type TEXT,
  ADD COLUMN IF NOT EXISTS content_data TEXT,
  ADD COLUMN IF NOT EXISTS order_index INT DEFAULT 0;

-- Enable RLS (idempotent)
ALTER TABLE public.members_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members_area_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.link_bios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.link_bio_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.websites ENABLE ROW LEVEL SECURITY;

-- Public read policies (create if missing)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='members_areas' AND policyname='Public view active areas'
  ) THEN
    CREATE POLICY "Public view active areas"
    ON public.members_areas
    FOR SELECT
    USING (is_active = true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='members_area_modules' AND policyname='Public view active modules'
  ) THEN
    CREATE POLICY "Public view active modules"
    ON public.members_area_modules
    FOR SELECT
    USING (
      is_active = true AND EXISTS (
        SELECT 1 FROM public.members_areas a
        WHERE a.id = members_area_modules.members_area_id AND a.is_active = true
      )
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='link_bios' AND policyname='Public view active bios'
  ) THEN
    CREATE POLICY "Public view active bios"
    ON public.link_bios
    FOR SELECT
    USING (is_active = true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='link_bio_links' AND policyname='Public view active bio links'
  ) THEN
    CREATE POLICY "Public view active bio links"
    ON public.link_bio_links
    FOR SELECT
    USING (
      is_active = true AND EXISTS (
        SELECT 1 FROM public.link_bios b WHERE b.id = link_bio_links.bio_id AND b.is_active = true
      )
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='quizzes' AND policyname='Public view active quizzes'
  ) THEN
    CREATE POLICY "Public view active quizzes"
    ON public.quizzes
    FOR SELECT
    USING (is_active = true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='websites' AND policyname='Public view published websites'
  ) THEN
    CREATE POLICY "Public view published websites"
    ON public.websites
    FOR SELECT
    USING (is_published = true);
  END IF;
END $$;

-- Storage bucket for members content
INSERT INTO storage.buckets (id, name, public)
VALUES ('members-content', 'members-content', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies (idempotent via DO blocks)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='storage' AND tablename='objects' AND policyname='Public read members content'
  ) THEN
    CREATE POLICY "Public read members content"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'members-content');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='storage' AND tablename='objects' AND policyname='Users manage own members content'
  ) THEN
    CREATE POLICY "Users manage own members content"
    ON storage.objects
    FOR ALL
    USING (bucket_id = 'members-content' AND owner = auth.uid())
    WITH CHECK (bucket_id = 'members-content' AND owner = auth.uid());
  END IF;
END $$;
