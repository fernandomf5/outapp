
-- Drop old quiz system completely
DROP TABLE IF EXISTS public.quiz_responses CASCADE;
DROP TABLE IF EXISTS public.quizzes CASCADE;

-- New simpler "Questionário Marketing" system
CREATE TABLE public.marketing_questionnaires (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  cover_image text,
  primary_color text DEFAULT '#6366f1',
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  offers jsonb NOT NULL DEFAULT '[]'::jsonb,
  capture_lead boolean NOT NULL DEFAULT true,
  capture_fields jsonb NOT NULL DEFAULT '["name","email","phone"]'::jsonb,
  send_to_crm boolean NOT NULL DEFAULT true,
  thank_you_title text DEFAULT 'Obrigado!',
  thank_you_description text DEFAULT 'Confira o que separamos para você:',
  is_active boolean NOT NULL DEFAULT true,
  total_responses integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.marketing_questionnaires TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_questionnaires TO authenticated;
GRANT ALL ON public.marketing_questionnaires TO service_role;

ALTER TABLE public.marketing_questionnaires ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their questionnaires"
  ON public.marketing_questionnaires FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can view active questionnaires"
  ON public.marketing_questionnaires FOR SELECT
  USING (is_active = true);

CREATE TRIGGER trg_marketing_questionnaires_updated_at
  BEFORE UPDATE ON public.marketing_questionnaires
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.marketing_questionnaire_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  questionnaire_id uuid NOT NULL REFERENCES public.marketing_questionnaires(id) ON DELETE CASCADE,
  name text,
  email text,
  phone text,
  answers jsonb NOT NULL DEFAULT '[]'::jsonb,
  matched_offer_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.marketing_questionnaire_responses TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_questionnaire_responses TO authenticated;
GRANT ALL ON public.marketing_questionnaire_responses TO service_role;

ALTER TABLE public.marketing_questionnaire_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can insert responses"
  ON public.marketing_questionnaire_responses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.marketing_questionnaires q
      WHERE q.id = questionnaire_id AND q.is_active = true
    )
  );

CREATE POLICY "Owners view their responses"
  ON public.marketing_questionnaire_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.marketing_questionnaires q
      WHERE q.id = questionnaire_id AND q.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners delete their responses"
  ON public.marketing_questionnaire_responses FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.marketing_questionnaires q
      WHERE q.id = questionnaire_id AND q.user_id = auth.uid()
    )
  );

CREATE INDEX idx_mq_responses_questionnaire ON public.marketing_questionnaire_responses(questionnaire_id);
CREATE INDEX idx_mq_user ON public.marketing_questionnaires(user_id);
