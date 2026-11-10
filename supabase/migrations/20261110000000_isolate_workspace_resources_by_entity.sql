-- Isolamento de dados por Gestão Livre.
-- Os registros legados são associados à primeira gestão cadastrada de cada usuário.
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'registration_categories','contacts','briefings','briefing_responses','tasks','task_blocks','agenda_events',
    'routines','routine_items','routine_objectives','routine_completions','routine_templates',
    'ai_agents','chatbots','link_bios','link_bio_links','mind_maps','contracts','contract_history',
    'aprova_job_clients','aprova_job_jobs','aprova_job_notifications','aprova_job_comments',
    'floating_buttons','short_links','saved_qr_codes','script_categories','saved_scripts',
    'sales_funnels','funnel_stages','funnel_leads','funnel_lead_history','customers','customer_categories'
  ];
  has_user_id boolean;
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF to_regclass(format('public.%I', t)) IS NOT NULL THEN
      EXECUTE format(
        'ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS entity_id uuid REFERENCES public.financial_businesses(id) ON DELETE CASCADE',
        t
      );

      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = t AND column_name = 'user_id'
      ) INTO has_user_id;

      IF has_user_id THEN
        EXECUTE format(
          'UPDATE public.%I AS resource
           SET entity_id = (
             SELECT business.id
             FROM public.financial_businesses AS business
             WHERE business.user_id = resource.user_id
             ORDER BY business.created_at ASC, business.id ASC
             LIMIT 1
           )
           WHERE resource.entity_id IS NULL
             AND EXISTS (
               SELECT 1 FROM public.financial_businesses AS business
               WHERE business.user_id = resource.user_id
             )',
          t
        );
      END IF;

      EXECUTE format(
        'CREATE INDEX IF NOT EXISTS %I ON public.%I (entity_id)',
        'idx_' || t || '_entity_id',
        t
      );
    END IF;
  END LOOP;
END $$;

-- A primeira gestão de cada usuário é o destino de dados legados.
-- Novas gestões não recebem cópias dos registros existentes.

-- Propagate the management scope to child rows that inherit ownership from a parent resource.
DO $$
BEGIN
  IF to_regclass('public.link_bio_links') IS NOT NULL AND to_regclass('public.link_bios') IS NOT NULL THEN
    UPDATE public.link_bio_links child SET entity_id = parent.entity_id
    FROM public.link_bios parent
    WHERE child.bio_id = parent.id AND child.entity_id IS NULL;
  END IF;
  IF to_regclass('public.contract_history') IS NOT NULL AND to_regclass('public.contracts') IS NOT NULL THEN
    UPDATE public.contract_history child SET entity_id = parent.entity_id
    FROM public.contracts parent
    WHERE child.contract_id = parent.id AND child.entity_id IS NULL;
  END IF;
  IF to_regclass('public.briefing_responses') IS NOT NULL AND to_regclass('public.briefings') IS NOT NULL THEN
    UPDATE public.briefing_responses child SET entity_id = parent.entity_id
    FROM public.briefings parent
    WHERE child.briefing_id = parent.id AND child.entity_id IS NULL;
  END IF;
  IF to_regclass('public.funnel_stages') IS NOT NULL AND to_regclass('public.sales_funnels') IS NOT NULL THEN
    UPDATE public.funnel_stages child SET entity_id = parent.entity_id
    FROM public.sales_funnels parent
    WHERE child.funnel_id = parent.id AND child.entity_id IS NULL;
  END IF;
  IF to_regclass('public.funnel_leads') IS NOT NULL AND to_regclass('public.sales_funnels') IS NOT NULL THEN
    UPDATE public.funnel_leads child SET entity_id = parent.entity_id
    FROM public.sales_funnels parent
    WHERE child.funnel_id = parent.id AND child.entity_id IS NULL;
  END IF;
  IF to_regclass('public.funnel_lead_history') IS NOT NULL AND to_regclass('public.funnel_leads') IS NOT NULL THEN
    UPDATE public.funnel_lead_history child SET entity_id = parent.entity_id
    FROM public.funnel_leads parent
    WHERE child.lead_id = parent.id AND child.entity_id IS NULL;
  END IF;
  IF to_regclass('public.aprova_job_comments') IS NOT NULL AND to_regclass('public.aprova_job_jobs') IS NOT NULL THEN
    UPDATE public.aprova_job_comments child SET entity_id = parent.entity_id
    FROM public.aprova_job_jobs parent
    WHERE child.job_id = parent.id AND child.entity_id IS NULL;
  END IF;
END $$;
