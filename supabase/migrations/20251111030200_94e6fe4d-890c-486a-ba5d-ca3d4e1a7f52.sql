
-- Adicionar policy SELECT pública para briefings ativos
CREATE POLICY "Anyone can view active briefings"
ON public.briefings
FOR SELECT
USING (is_active = true);

-- Criar bucket de storage para arquivos de briefing
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'briefing-files', 
  'briefing-files', 
  false, 
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain', 'application/zip']
)
ON CONFLICT (id) DO NOTHING;

-- Policy para qualquer pessoa fazer upload de arquivos em briefing-files
CREATE POLICY "Anyone can upload briefing files"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'briefing-files');

-- Policy para qualquer pessoa visualizar arquivos de briefing
CREATE POLICY "Anyone can view briefing files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'briefing-files');

-- Policy para donos de briefings poderem deletar arquivos
CREATE POLICY "Briefing owners can delete files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'briefing-files' AND
  EXISTS (
    SELECT 1 FROM public.briefings
    WHERE briefings.user_id = auth.uid()
  )
);
