-- Criar tabela de notificações de tickets
CREATE TABLE IF NOT EXISTS public.ticket_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_ticket_notifications_ticket FOREIGN KEY (ticket_id) REFERENCES public.tickets(id) ON DELETE CASCADE
);

-- Habilitar RLS
ALTER TABLE public.ticket_notifications ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para notificações de tickets
CREATE POLICY "Users can view their own ticket notifications"
  ON public.ticket_notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification read status"
  ON public.ticket_notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all ticket notifications"
  ON public.ticket_notifications
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can create ticket notifications"
  ON public.ticket_notifications
  FOR INSERT
  WITH CHECK (true);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_ticket_notifications_user_id ON public.ticket_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_ticket_notifications_ticket_id ON public.ticket_notifications(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_notifications_is_read ON public.ticket_notifications(is_read);

-- Trigger para criar notificações quando mensagens são enviadas
CREATE OR REPLACE FUNCTION public.create_ticket_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ticket_owner_id UUID;
  admin_users UUID[];
BEGIN
  -- Buscar o dono do ticket
  SELECT user_id INTO ticket_owner_id
  FROM public.tickets
  WHERE id = NEW.ticket_id;

  -- Se a mensagem é de um admin, notificar o usuário
  IF NEW.is_admin = true THEN
    INSERT INTO public.ticket_notifications (user_id, ticket_id, message)
    VALUES (ticket_owner_id, NEW.ticket_id, 'Nova resposta no seu ticket');
  ELSE
    -- Se a mensagem é do usuário, notificar todos os admins
    SELECT array_agg(user_id) INTO admin_users
    FROM public.user_roles
    WHERE role = 'admin'::app_role;

    -- Inserir notificação para cada admin
    IF admin_users IS NOT NULL THEN
      INSERT INTO public.ticket_notifications (user_id, ticket_id, message)
      SELECT unnest(admin_users), NEW.ticket_id, 'Nova mensagem em ticket de suporte';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_create_ticket_notification ON public.ticket_messages;
CREATE TRIGGER trigger_create_ticket_notification
  AFTER INSERT ON public.ticket_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.create_ticket_notification();

-- Habilitar realtime para a tabela de notificações
ALTER TABLE public.ticket_notifications REPLICA IDENTITY FULL;