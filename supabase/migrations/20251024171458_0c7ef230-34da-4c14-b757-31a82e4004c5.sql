-- Habilitar realtime para ticket_notifications
ALTER TABLE public.ticket_notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_notifications;

-- Criar trigger para notificar admins quando um novo ticket é criado
CREATE OR REPLACE FUNCTION public.notify_admins_new_ticket()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  admin_users UUID[];
BEGIN
  -- Buscar todos os admins
  SELECT array_agg(user_id) INTO admin_users
  FROM public.user_roles
  WHERE role = 'admin'::app_role;

  -- Inserir notificação para cada admin
  IF admin_users IS NOT NULL THEN
    INSERT INTO public.ticket_notifications (user_id, ticket_id, message)
    SELECT unnest(admin_users), NEW.id, 'Novo ticket criado: ' || NEW.title;
  END IF;

  RETURN NEW;
END;
$$;

-- Criar trigger para quando ticket é criado
DROP TRIGGER IF EXISTS notify_admins_on_new_ticket ON public.tickets;
CREATE TRIGGER notify_admins_on_new_ticket
AFTER INSERT ON public.tickets
FOR EACH ROW
EXECUTE FUNCTION public.notify_admins_new_ticket();