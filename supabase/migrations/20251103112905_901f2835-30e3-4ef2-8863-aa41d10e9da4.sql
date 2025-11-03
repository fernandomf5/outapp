-- Create function and trigger to notify agent owners on new customer messages
-- This inserts a row into agent_notifications whenever a new message from a customer is added to agent_messages

CREATE OR REPLACE FUNCTION public.notify_agent_on_customer_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_agent_id uuid;
  v_title text;
  v_message text;
BEGIN
  -- Only notify for messages sent by the customer in agent conversations
  IF NEW.role IS DISTINCT FROM 'customer' THEN
    RETURN NEW;
  END IF;

  -- Find the agent_id for this conversation
  SELECT ac.agent_id
    INTO v_agent_id
  FROM public.agent_conversations ac
  WHERE ac.id = NEW.conversation_id;

  IF v_agent_id IS NULL THEN
    RETURN NEW; -- No agent found; nothing to notify
  END IF;

  v_title := 'Nova Mensagem de ' || COALESCE(NULLIF(NEW.sender_name, ''), 'Cliente');
  v_message := LEFT(COALESCE(NULLIF(NEW.content, ''), 'Mensagem recebida'), 240);

  INSERT INTO public.agent_notifications (
    notification_type,
    agent_id,
    title,
    message,
    reference_id
  ) VALUES (
    'new_message',
    v_agent_id,
    v_title,
    v_message,
    NEW.conversation_id
  );

  RETURN NEW;
END;
$$;

-- Create trigger (if it doesn't exist already)
DROP TRIGGER IF EXISTS trg_notify_agent_on_customer_message ON public.agent_messages;
CREATE TRIGGER trg_notify_agent_on_customer_message
AFTER INSERT ON public.agent_messages
FOR EACH ROW
EXECUTE FUNCTION public.notify_agent_on_customer_message();