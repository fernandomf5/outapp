
-- Toggle to enable Q&A per area
ALTER TABLE public.simple_members_areas
  ADD COLUMN IF NOT EXISTS enable_questions boolean NOT NULL DEFAULT false;

-- Q&A table
CREATE TABLE IF NOT EXISTS public.members_area_video_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id uuid NOT NULL REFERENCES public.simple_members_areas(id) ON DELETE CASCADE,
  owner_user_id uuid NOT NULL,
  access_code_id uuid REFERENCES public.members_area_access_codes(id) ON DELETE CASCADE,
  student_name text NOT NULL DEFAULT 'Aluno',
  block_id text NOT NULL,
  video_index integer NOT NULL DEFAULT 0,
  question text NOT NULL,
  answer text,
  answered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.members_area_video_questions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.members_area_video_questions TO authenticated;
GRANT ALL ON public.members_area_video_questions TO service_role;

ALTER TABLE public.members_area_video_questions ENABLE ROW LEVEL SECURITY;

-- Owner (the teacher) can manage all questions of their areas
CREATE POLICY "Owner manages all questions"
  ON public.members_area_video_questions
  FOR ALL
  USING (auth.uid() = owner_user_id)
  WITH CHECK (auth.uid() = owner_user_id);

-- Public (students using access codes) can read/insert/update their own row by access_code_id.
-- Isolation is enforced at the application layer using the validated access code id.
CREATE POLICY "Public can read questions"
  ON public.members_area_video_questions
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public can insert questions"
  ON public.members_area_video_questions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE TRIGGER trg_members_area_video_questions_updated_at
  BEFORE UPDATE ON public.members_area_video_questions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Realtime
ALTER TABLE public.members_area_video_questions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.members_area_video_questions;

CREATE INDEX IF NOT EXISTS idx_mavq_area ON public.members_area_video_questions(area_id);
CREATE INDEX IF NOT EXISTS idx_mavq_access_code ON public.members_area_video_questions(access_code_id);
CREATE INDEX IF NOT EXISTS idx_mavq_owner ON public.members_area_video_questions(owner_user_id);
