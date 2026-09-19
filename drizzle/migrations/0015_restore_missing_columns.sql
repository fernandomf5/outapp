-- Financial transactions: restore entity type (PF/PJ) and make legacy date column self-filling
ALTER TABLE public.financial_transactions ADD COLUMN IF NOT EXISTS entity_type TEXT DEFAULT 'pf';
ALTER TABLE public.financial_transactions ALTER COLUMN date SET DEFAULT CURRENT_DATE;
ALTER TABLE public.financial_transactions ALTER COLUMN payment_method SET DEFAULT 'pix';
ALTER TABLE public.financial_transactions ALTER COLUMN category SET DEFAULT '';
ALTER TABLE public.financial_transactions ALTER COLUMN description SET DEFAULT '';
UPDATE public.financial_transactions SET entity_type = COALESCE(entity_type, 'pf');

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'financial_transactions_entity_type_check'
  ) THEN
    ALTER TABLE public.financial_transactions
      ADD CONSTRAINT financial_transactions_entity_type_check
      CHECK (entity_type IN ('pf', 'pj'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_financial_transactions_entity_type
  ON public.financial_transactions (user_id, entity_type);

-- Script organizer scheduling columns
ALTER TABLE public.saved_scripts ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;
ALTER TABLE public.saved_scripts ADD COLUMN IF NOT EXISTS platform TEXT;
ALTER TABLE public.saved_scripts ADD COLUMN IF NOT EXISTS post_status TEXT DEFAULT 'idea';
ALTER TABLE public.saved_scripts ADD COLUMN IF NOT EXISTS agenda_event_id UUID REFERENCES public.agenda_events(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_saved_scripts_agenda_event ON public.saved_scripts (agenda_event_id);

-- Other columns missing after the database rebuild
ALTER TABLE public.members_areas ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.briefing_responses ADD COLUMN IF NOT EXISTS visitor_company TEXT;
ALTER TABLE public.feature_overrides ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.members_area_access_requests ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.members_area_access_requests ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.team_member_sessions ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ;