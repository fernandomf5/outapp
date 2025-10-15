-- Permitir que usuários criem suas próprias assinaturas (necessário para vouchers)
CREATE POLICY "Users can create their own subscriptions"
ON public.subscriptions
FOR INSERT
WITH CHECK (auth.uid() = user_id);