-- Create table to track per-user read status for broadcast messages
CREATE TABLE IF NOT EXISTS public.admin_message_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.admin_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT admin_message_reads_unique UNIQUE (message_id, user_id)
);

-- Enable RLS
ALTER TABLE public.admin_message_reads ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own message reads"
ON public.admin_message_reads
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all message reads"
ON public.admin_message_reads
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger to update updated_at
CREATE TRIGGER update_admin_message_reads_updated_at
BEFORE UPDATE ON public.admin_message_reads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_admin_message_reads_message_id ON public.admin_message_reads (message_id);
CREATE INDEX IF NOT EXISTS idx_admin_message_reads_user_id ON public.admin_message_reads (user_id);
