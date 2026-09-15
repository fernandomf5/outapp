ALTER TABLE public.task_blocks
  ADD COLUMN IF NOT EXISTS contact_id uuid REFERENCES public.contacts(id) ON DELETE CASCADE;

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_task_blocks_user_contact_order
  ON public.task_blocks (user_id, contact_id, order_index);

CREATE INDEX IF NOT EXISTS idx_tasks_user_contact_archived_order
  ON public.tasks (user_id, contact_id, archived, task_order);