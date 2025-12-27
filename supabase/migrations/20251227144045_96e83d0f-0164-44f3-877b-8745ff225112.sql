-- Add is_welcome_message column to admin_messages
-- Welcome messages are only shown to users who signed up AFTER the message was created
ALTER TABLE public.admin_messages 
ADD COLUMN is_welcome_message boolean NOT NULL DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.admin_messages.is_welcome_message IS 'If true, this message is only shown to users who signed up after the message was created';