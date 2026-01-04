
-- RLS policies for task_blocks and task_categories (corrected)

-- task_blocks - SELECT
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'task_blocks'
      AND policyname = 'Team members can read delegated task blocks'
  ) THEN
    CREATE POLICY "Team members can read delegated task blocks"
    ON public.task_blocks
    FOR SELECT
    USING (
      public.team_member_can(user_id, 'task_organizer', 'read'::public.permission_action, client_id)
    );
  END IF;
END $$;

-- task_blocks - INSERT
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'task_blocks'
      AND policyname = 'Team members can create delegated task blocks'
  ) THEN
    CREATE POLICY "Team members can create delegated task blocks"
    ON public.task_blocks
    FOR INSERT
    WITH CHECK (
      public.team_member_can(user_id, 'task_organizer', 'create'::public.permission_action, client_id)
    );
  END IF;
END $$;

-- task_blocks - UPDATE
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'task_blocks'
      AND policyname = 'Team members can update delegated task blocks'
  ) THEN
    CREATE POLICY "Team members can update delegated task blocks"
    ON public.task_blocks
    FOR UPDATE
    USING (
      public.team_member_can(user_id, 'task_organizer', 'update'::public.permission_action, client_id)
    );
  END IF;
END $$;

-- task_blocks - DELETE
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'task_blocks'
      AND policyname = 'Team members can delete delegated task blocks'
  ) THEN
    CREATE POLICY "Team members can delete delegated task blocks"
    ON public.task_blocks
    FOR DELETE
    USING (
      public.team_member_can(user_id, 'task_organizer', 'delete'::public.permission_action, client_id)
    );
  END IF;
END $$;

-- task_categories - SELECT
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'task_categories'
      AND policyname = 'Team members can read delegated task categories'
  ) THEN
    CREATE POLICY "Team members can read delegated task categories"
    ON public.task_categories
    FOR SELECT
    USING (
      public.team_member_can(user_id, 'task_organizer', 'read'::public.permission_action, NULL)
    );
  END IF;
END $$;
