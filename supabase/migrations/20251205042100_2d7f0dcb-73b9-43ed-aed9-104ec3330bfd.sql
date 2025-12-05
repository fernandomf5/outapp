-- Create trigger to notify user when client adds a comment
CREATE OR REPLACE FUNCTION public.notify_job_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid;
  v_job_title text;
  v_client_name text;
BEGIN
  -- Only notify for comments from clients
  IF NEW.is_from_client = true THEN
    -- Get the user_id and job title
    SELECT j.user_id, j.title INTO v_user_id, v_job_title
    FROM public.aprova_job_jobs j
    WHERE j.id = NEW.job_id;

    -- Get client name if available
    IF NEW.client_id IS NOT NULL THEN
      SELECT name INTO v_client_name
      FROM public.aprova_job_clients
      WHERE id = NEW.client_id;
    END IF;

    -- Create notification
    INSERT INTO public.aprova_job_notifications (user_id, job_id, client_id, title, message)
    VALUES (
      v_user_id,
      NEW.job_id,
      NEW.client_id,
      'Novo Comentário',
      'O cliente ' || COALESCE(v_client_name, 'desconhecido') || ' comentou no job: ' || COALESCE(v_job_title, 'Sem título') || ' - "' || LEFT(NEW.content, 100) || '"'
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger on comments table
DROP TRIGGER IF EXISTS on_job_comment_created ON public.aprova_job_comments;
CREATE TRIGGER on_job_comment_created
  AFTER INSERT ON public.aprova_job_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_job_comment();