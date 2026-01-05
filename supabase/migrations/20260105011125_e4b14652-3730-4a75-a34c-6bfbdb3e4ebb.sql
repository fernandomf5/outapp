-- Add/repair Team Member delegation RLS for Ads, Tasks, Cloner, Briefings, Portfolio

-- 1) Fix existing task_* team policies to use module_key = 'tasks' (not 'task_organizer')
DROP POLICY IF EXISTS "Team members can read delegated task blocks" ON public.task_blocks;
DROP POLICY IF EXISTS "Team members can create delegated task blocks" ON public.task_blocks;
DROP POLICY IF EXISTS "Team members can update delegated task blocks" ON public.task_blocks;
DROP POLICY IF EXISTS "Team members can delete delegated task blocks" ON public.task_blocks;
DROP POLICY IF EXISTS "Team members can read delegated task categories" ON public.task_categories;

CREATE POLICY "Team members can read delegated task blocks"
ON public.task_blocks
FOR SELECT
USING (
  public.team_member_can(user_id, 'tasks', 'read'::public.permission_action, client_id)
);

CREATE POLICY "Team members can create delegated task blocks"
ON public.task_blocks
FOR INSERT
WITH CHECK (
  public.team_member_can(user_id, 'tasks', 'create'::public.permission_action, client_id)
);

CREATE POLICY "Team members can update delegated task blocks"
ON public.task_blocks
FOR UPDATE
USING (
  public.team_member_can(user_id, 'tasks', 'update'::public.permission_action, client_id)
);

CREATE POLICY "Team members can delete delegated task blocks"
ON public.task_blocks
FOR DELETE
USING (
  public.team_member_can(user_id, 'tasks', 'delete'::public.permission_action, client_id)
);

CREATE POLICY "Team members can read delegated task categories"
ON public.task_categories
FOR SELECT
USING (
  public.team_member_can(user_id, 'tasks', 'read'::public.permission_action, NULL)
);

-- Team policies for tasks table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='tasks'
      AND policyname='Team members can read delegated tasks'
  ) THEN
    CREATE POLICY "Team members can read delegated tasks"
    ON public.tasks
    FOR SELECT
    USING (
      public.team_member_can(user_id, 'tasks', 'read'::public.permission_action, client_id)
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='tasks'
      AND policyname='Team members can create delegated tasks'
  ) THEN
    CREATE POLICY "Team members can create delegated tasks"
    ON public.tasks
    FOR INSERT
    WITH CHECK (
      public.team_member_can(user_id, 'tasks', 'create'::public.permission_action, client_id)
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='tasks'
      AND policyname='Team members can update delegated tasks'
  ) THEN
    CREATE POLICY "Team members can update delegated tasks"
    ON public.tasks
    FOR UPDATE
    USING (
      public.team_member_can(user_id, 'tasks', 'update'::public.permission_action, client_id)
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='tasks'
      AND policyname='Team members can delete delegated tasks'
  ) THEN
    CREATE POLICY "Team members can delete delegated tasks"
    ON public.tasks
    FOR DELETE
    USING (
      public.team_member_can(user_id, 'tasks', 'delete'::public.permission_action, client_id)
    );
  END IF;
END $$;

-- 2) Ads: ad_campaigns + ad_clients
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='ad_campaigns'
      AND policyname='Team members can read delegated ad campaigns'
  ) THEN
    CREATE POLICY "Team members can read delegated ad campaigns"
    ON public.ad_campaigns
    FOR SELECT
    USING (
      public.team_member_can(user_id, 'ads', 'read'::public.permission_action, id)
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='ad_campaigns'
      AND policyname='Team members can create delegated ad campaigns'
  ) THEN
    CREATE POLICY "Team members can create delegated ad campaigns"
    ON public.ad_campaigns
    FOR INSERT
    WITH CHECK (
      public.team_member_can(user_id, 'ads', 'create'::public.permission_action, NULL)
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='ad_campaigns'
      AND policyname='Team members can update delegated ad campaigns'
  ) THEN
    CREATE POLICY "Team members can update delegated ad campaigns"
    ON public.ad_campaigns
    FOR UPDATE
    USING (
      public.team_member_can(user_id, 'ads', 'update'::public.permission_action, id)
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='ad_campaigns'
      AND policyname='Team members can delete delegated ad campaigns'
  ) THEN
    CREATE POLICY "Team members can delete delegated ad campaigns"
    ON public.ad_campaigns
    FOR DELETE
    USING (
      public.team_member_can(user_id, 'ads', 'delete'::public.permission_action, id)
    );
  END IF;
END $$;

-- Clients are allowed if they belong to at least one delegated campaign
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='ad_clients'
      AND policyname='Team members can read delegated ad clients'
  ) THEN
    CREATE POLICY "Team members can read delegated ad clients"
    ON public.ad_clients
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1
        FROM public.ad_campaigns ac
        WHERE ac.client_id = ad_clients.id
          AND public.team_member_can(ac.user_id, 'ads', 'read'::public.permission_action, ac.id)
      )
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='ad_clients'
      AND policyname='Team members can create delegated ad clients'
  ) THEN
    CREATE POLICY "Team members can create delegated ad clients"
    ON public.ad_clients
    FOR INSERT
    WITH CHECK (
      public.team_member_can(user_id, 'ads', 'create'::public.permission_action, NULL)
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='ad_clients'
      AND policyname='Team members can update delegated ad clients'
  ) THEN
    CREATE POLICY "Team members can update delegated ad clients"
    ON public.ad_clients
    FOR UPDATE
    USING (
      EXISTS (
        SELECT 1
        FROM public.ad_campaigns ac
        WHERE ac.client_id = ad_clients.id
          AND public.team_member_can(ac.user_id, 'ads', 'update'::public.permission_action, ac.id)
      )
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='ad_clients'
      AND policyname='Team members can delete delegated ad clients'
  ) THEN
    CREATE POLICY "Team members can delete delegated ad clients"
    ON public.ad_clients
    FOR DELETE
    USING (
      EXISTS (
        SELECT 1
        FROM public.ad_campaigns ac
        WHERE ac.client_id = ad_clients.id
          AND public.team_member_can(ac.user_id, 'ads', 'delete'::public.permission_action, ac.id)
      )
    );
  END IF;
END $$;

-- 3) Cloner: cloned_pages + leads + analytics
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='cloned_pages'
      AND policyname='Team members can read delegated cloned pages'
  ) THEN
    CREATE POLICY "Team members can read delegated cloned pages"
    ON public.cloned_pages
    FOR SELECT
    USING (
      public.team_member_can(user_id, 'cloner', 'read'::public.permission_action, id)
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='cloned_pages'
      AND policyname='Team members can create delegated cloned pages'
  ) THEN
    CREATE POLICY "Team members can create delegated cloned pages"
    ON public.cloned_pages
    FOR INSERT
    WITH CHECK (
      public.team_member_can(user_id, 'cloner', 'create'::public.permission_action, NULL)
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='cloned_pages'
      AND policyname='Team members can update delegated cloned pages'
  ) THEN
    CREATE POLICY "Team members can update delegated cloned pages"
    ON public.cloned_pages
    FOR UPDATE
    USING (
      public.team_member_can(user_id, 'cloner', 'update'::public.permission_action, id)
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='cloned_pages'
      AND policyname='Team members can delete delegated cloned pages'
  ) THEN
    CREATE POLICY "Team members can delete delegated cloned pages"
    ON public.cloned_pages
    FOR DELETE
    USING (
      public.team_member_can(user_id, 'cloner', 'delete'::public.permission_action, id)
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='cloned_page_leads'
      AND policyname='Team members can read delegated cloned page leads'
  ) THEN
    CREATE POLICY "Team members can read delegated cloned page leads"
    ON public.cloned_page_leads
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1
        FROM public.cloned_pages cp
        WHERE cp.id = cloned_page_leads.page_id
          AND public.team_member_can(cp.user_id, 'cloner', 'read'::public.permission_action, cp.id)
      )
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='cloned_page_leads'
      AND policyname='Team members can update delegated cloned page leads'
  ) THEN
    CREATE POLICY "Team members can update delegated cloned page leads"
    ON public.cloned_page_leads
    FOR UPDATE
    USING (
      EXISTS (
        SELECT 1
        FROM public.cloned_pages cp
        WHERE cp.id = cloned_page_leads.page_id
          AND public.team_member_can(cp.user_id, 'cloner', 'update'::public.permission_action, cp.id)
      )
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='cloned_page_leads'
      AND policyname='Team members can delete delegated cloned page leads'
  ) THEN
    CREATE POLICY "Team members can delete delegated cloned page leads"
    ON public.cloned_page_leads
    FOR DELETE
    USING (
      EXISTS (
        SELECT 1
        FROM public.cloned_pages cp
        WHERE cp.id = cloned_page_leads.page_id
          AND public.team_member_can(cp.user_id, 'cloner', 'delete'::public.permission_action, cp.id)
      )
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='cloned_page_analytics'
      AND policyname='Team members can read delegated cloned page analytics'
  ) THEN
    CREATE POLICY "Team members can read delegated cloned page analytics"
    ON public.cloned_page_analytics
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1
        FROM public.cloned_pages cp
        WHERE cp.id = cloned_page_analytics.page_id
          AND public.team_member_can(cp.user_id, 'cloner', 'read'::public.permission_action, cp.id)
      )
    );
  END IF;
END $$;

-- 4) Briefings: briefings + responses
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='briefings'
      AND policyname='Team members can read delegated briefings'
  ) THEN
    CREATE POLICY "Team members can read delegated briefings"
    ON public.briefings
    FOR SELECT
    USING (
      public.team_member_can(user_id, 'briefings', 'read'::public.permission_action, id)
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='briefings'
      AND policyname='Team members can create delegated briefings'
  ) THEN
    CREATE POLICY "Team members can create delegated briefings"
    ON public.briefings
    FOR INSERT
    WITH CHECK (
      public.team_member_can(user_id, 'briefings', 'create'::public.permission_action, NULL)
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='briefings'
      AND policyname='Team members can update delegated briefings'
  ) THEN
    CREATE POLICY "Team members can update delegated briefings"
    ON public.briefings
    FOR UPDATE
    USING (
      public.team_member_can(user_id, 'briefings', 'update'::public.permission_action, id)
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='briefings'
      AND policyname='Team members can delete delegated briefings'
  ) THEN
    CREATE POLICY "Team members can delete delegated briefings"
    ON public.briefings
    FOR DELETE
    USING (
      public.team_member_can(user_id, 'briefings', 'delete'::public.permission_action, id)
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='briefing_responses'
      AND policyname='Team members can read delegated briefing responses'
  ) THEN
    CREATE POLICY "Team members can read delegated briefing responses"
    ON public.briefing_responses
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1
        FROM public.briefings b
        WHERE b.id = briefing_responses.briefing_id
          AND public.team_member_can(b.user_id, 'briefings', 'read'::public.permission_action, b.id)
      )
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='briefing_responses'
      AND policyname='Team members can delete delegated briefing responses'
  ) THEN
    CREATE POLICY "Team members can delete delegated briefing responses"
    ON public.briefing_responses
    FOR DELETE
    USING (
      EXISTS (
        SELECT 1
        FROM public.briefings b
        WHERE b.id = briefing_responses.briefing_id
          AND public.team_member_can(b.user_id, 'briefings', 'delete'::public.permission_action, b.id)
      )
    );
  END IF;
END $$;

-- 5) Portfolio: portfolios + items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='portfolios'
      AND policyname='Team members can read delegated portfolios'
  ) THEN
    CREATE POLICY "Team members can read delegated portfolios"
    ON public.portfolios
    FOR SELECT
    USING (
      public.team_member_can(user_id, 'portfolio', 'read'::public.permission_action, id)
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='portfolios'
      AND policyname='Team members can create delegated portfolios'
  ) THEN
    CREATE POLICY "Team members can create delegated portfolios"
    ON public.portfolios
    FOR INSERT
    WITH CHECK (
      public.team_member_can(user_id, 'portfolio', 'create'::public.permission_action, NULL)
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='portfolios'
      AND policyname='Team members can update delegated portfolios'
  ) THEN
    CREATE POLICY "Team members can update delegated portfolios"
    ON public.portfolios
    FOR UPDATE
    USING (
      public.team_member_can(user_id, 'portfolio', 'update'::public.permission_action, id)
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='portfolios'
      AND policyname='Team members can delete delegated portfolios'
  ) THEN
    CREATE POLICY "Team members can delete delegated portfolios"
    ON public.portfolios
    FOR DELETE
    USING (
      public.team_member_can(user_id, 'portfolio', 'delete'::public.permission_action, id)
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='portfolio_items'
      AND policyname='Team members can create delegated portfolio items'
  ) THEN
    CREATE POLICY "Team members can create delegated portfolio items"
    ON public.portfolio_items
    FOR INSERT
    WITH CHECK (
      EXISTS (
        SELECT 1
        FROM public.portfolios p
        WHERE p.id = portfolio_items.portfolio_id
          AND public.team_member_can(p.user_id, 'portfolio', 'update'::public.permission_action, p.id)
      )
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='portfolio_items'
      AND policyname='Team members can update delegated portfolio items'
  ) THEN
    CREATE POLICY "Team members can update delegated portfolio items"
    ON public.portfolio_items
    FOR UPDATE
    USING (
      EXISTS (
        SELECT 1
        FROM public.portfolios p
        WHERE p.id = portfolio_items.portfolio_id
          AND public.team_member_can(p.user_id, 'portfolio', 'update'::public.permission_action, p.id)
      )
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='portfolio_items'
      AND policyname='Team members can delete delegated portfolio items'
  ) THEN
    CREATE POLICY "Team members can delete delegated portfolio items"
    ON public.portfolio_items
    FOR DELETE
    USING (
      EXISTS (
        SELECT 1
        FROM public.portfolios p
        WHERE p.id = portfolio_items.portfolio_id
          AND public.team_member_can(p.user_id, 'portfolio', 'delete'::public.permission_action, p.id)
      )
    );
  END IF;
END $$;
