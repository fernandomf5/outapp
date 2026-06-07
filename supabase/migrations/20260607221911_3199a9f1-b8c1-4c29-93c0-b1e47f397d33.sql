ALTER TABLE public.task_blocks DROP CONSTRAINT IF EXISTS task_blocks_client_id_fkey;
ALTER TABLE public.task_blocks ADD CONSTRAINT task_blocks_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.contacts(id) ON DELETE CASCADE;

ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_client_id_fkey;
ALTER TABLE public.tasks ADD CONSTRAINT tasks_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.contacts(id) ON DELETE CASCADE;