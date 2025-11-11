-- Adicionar política de DELETE para briefing_responses
-- Permite que o dono do briefing exclua as respostas
CREATE POLICY "Usuários podem excluir respostas de seus briefings"
ON public.briefing_responses
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.briefings
    WHERE briefings.id = briefing_responses.briefing_id
    AND briefings.user_id = auth.uid()
  )
);

-- Garantir que o bucket briefing-files é público
UPDATE storage.buckets
SET public = true
WHERE id = 'briefing-files';