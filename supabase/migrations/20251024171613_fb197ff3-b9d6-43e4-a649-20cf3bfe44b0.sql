-- Permitir admins deletarem notificações de tickets
DROP POLICY IF EXISTS "Admins can delete ticket notifications" ON public.ticket_notifications;

CREATE POLICY "Admins can delete ticket notifications"
ON public.ticket_notifications
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Permitir usuários deletarem suas próprias notificações
DROP POLICY IF EXISTS "Users can delete their own ticket notifications" ON public.ticket_notifications;

CREATE POLICY "Users can delete their own ticket notifications"
ON public.ticket_notifications
FOR DELETE
USING (auth.uid() = user_id);