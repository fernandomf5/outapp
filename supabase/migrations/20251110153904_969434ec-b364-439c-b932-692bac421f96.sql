-- Add ON DELETE CASCADE to ticket_messages foreign key
ALTER TABLE public.ticket_messages 
DROP CONSTRAINT IF EXISTS ticket_messages_ticket_id_fkey;

ALTER TABLE public.ticket_messages
ADD CONSTRAINT ticket_messages_ticket_id_fkey 
FOREIGN KEY (ticket_id) 
REFERENCES public.tickets(id) 
ON DELETE CASCADE;

-- Add ON DELETE CASCADE to ticket_notifications foreign key
ALTER TABLE public.ticket_notifications 
DROP CONSTRAINT IF EXISTS ticket_notifications_ticket_id_fkey;

ALTER TABLE public.ticket_notifications
ADD CONSTRAINT ticket_notifications_ticket_id_fkey 
FOREIGN KEY (ticket_id) 
REFERENCES public.tickets(id) 
ON DELETE CASCADE;