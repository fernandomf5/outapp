-- Permitir usuários deletarem seus próprios tickets
CREATE POLICY "Users can delete their own tickets"
ON public.tickets
FOR DELETE
USING (auth.uid() = user_id);