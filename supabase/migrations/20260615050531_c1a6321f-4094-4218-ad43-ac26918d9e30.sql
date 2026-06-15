DROP POLICY IF EXISTS "Public can update unanswered questions" ON public.members_area_video_questions;
DROP POLICY IF EXISTS "Public can delete unanswered questions" ON public.members_area_video_questions;

CREATE POLICY "Public can update questions"
ON public.members_area_video_questions
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Public can delete questions"
ON public.members_area_video_questions
FOR DELETE
TO anon, authenticated
USING (true);