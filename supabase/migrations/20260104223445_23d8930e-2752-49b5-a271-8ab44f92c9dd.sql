-- Add RLS policies to allow team members to see/manage delegated Financial items

-- financial_businesses
ALTER TABLE public.financial_businesses ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'financial_businesses'
      AND policyname = 'Team members can read delegated businesses'
  ) THEN
    CREATE POLICY "Team members can read delegated businesses"
    ON public.financial_businesses
    FOR SELECT
    USING (
      public.team_member_can(public.financial_businesses.user_id, 'financial', 'read'::public.permission_action, public.financial_businesses.id)
    );
  END IF;
END $$;

-- financial_transactions
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'financial_transactions'
      AND policyname = 'Team members can read delegated transactions'
  ) THEN
    CREATE POLICY "Team members can read delegated transactions"
    ON public.financial_transactions
    FOR SELECT
    USING (
      public.financial_transactions.business_id IS NOT NULL
      AND public.team_member_can(public.financial_transactions.user_id, 'financial', 'read'::public.permission_action, public.financial_transactions.business_id)
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'financial_transactions'
      AND policyname = 'Team members can create delegated transactions'
  ) THEN
    CREATE POLICY "Team members can create delegated transactions"
    ON public.financial_transactions
    FOR INSERT
    WITH CHECK (
      public.financial_transactions.business_id IS NOT NULL
      AND public.team_member_can(public.financial_transactions.user_id, 'financial', 'create'::public.permission_action, public.financial_transactions.business_id)
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'financial_transactions'
      AND policyname = 'Team members can update delegated transactions'
  ) THEN
    CREATE POLICY "Team members can update delegated transactions"
    ON public.financial_transactions
    FOR UPDATE
    USING (
      public.financial_transactions.business_id IS NOT NULL
      AND public.team_member_can(public.financial_transactions.user_id, 'financial', 'update'::public.permission_action, public.financial_transactions.business_id)
    )
    WITH CHECK (
      public.financial_transactions.business_id IS NOT NULL
      AND public.team_member_can(public.financial_transactions.user_id, 'financial', 'update'::public.permission_action, public.financial_transactions.business_id)
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'financial_transactions'
      AND policyname = 'Team members can delete delegated transactions'
  ) THEN
    CREATE POLICY "Team members can delete delegated transactions"
    ON public.financial_transactions
    FOR DELETE
    USING (
      public.financial_transactions.business_id IS NOT NULL
      AND public.team_member_can(public.financial_transactions.user_id, 'financial', 'delete'::public.permission_action, public.financial_transactions.business_id)
    );
  END IF;
END $$;
