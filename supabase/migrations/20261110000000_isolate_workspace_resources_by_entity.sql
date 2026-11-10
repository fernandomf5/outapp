-- Isolamento de dados por Gestão Livre.
-- Os registros legados são associados à primeira gestão cadastrada de cada usuário.
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'registration_categories','contacts','tasks','task_blocks','agenda_events',
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
