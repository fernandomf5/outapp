CREATE POLICY "Public can update unanswered questions"
  ON public.members_area_video_questions
  FOR UPDATE
  TO anon, authenticated
  USING (answer IS NULL)
  WITH CHECK (answer IS NULL);

CREATE POLICY "Public can delete unanswered questions"
  ON public.members_area_video_questions
  FOR DELETE
  TO anon, authenticated
  USING (answer IS NULL);
