CREATE TABLE IF NOT EXISTS public.quick_note_tabs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quick_note_tabs TO authenticated;
GRANT ALL ON public.quick_note_tabs TO service_role;
ALTER TABLE public.quick_note_tabs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own note tabs" ON public.quick_note_tabs;
CREATE POLICY "Users manage own note tabs" ON public.quick_note_tabs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
ALTER TABLE public.quick_notes ADD COLUMN IF NOT EXISTS tab_id UUID REFERENCES public.quick_note_tabs(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS quick_notes_tab_id_idx ON public.quick_notes(tab_id);