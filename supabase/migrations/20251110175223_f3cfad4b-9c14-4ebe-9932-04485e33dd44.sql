-- Add client_id column to tasks and relate to customers
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS client_id uuid NULL;

ALTER TABLE public.tasks
ADD CONSTRAINT tasks_client_id_fkey
FOREIGN KEY (client_id) REFERENCES public.customers(id)
ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_client_id ON public.tasks(client_id);