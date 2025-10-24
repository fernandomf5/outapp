-- Permitir usuários atualizarem suas próprias subscriptions (para poder cancelar/ativar)
DROP POLICY IF EXISTS "Users can update their own subscriptions" ON public.subscriptions;

CREATE POLICY "Users can update their own subscriptions"
ON public.subscriptions
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Melhorar política de delete também (caso precisem remover subscriptions antigas)
DROP POLICY IF EXISTS "Users can delete their own subscriptions" ON public.subscriptions;

CREATE POLICY "Users can delete their own subscriptions"
ON public.subscriptions
FOR DELETE
USING (auth.uid() = user_id);