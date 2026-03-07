
-- Add reminder settings to recurring plans
ALTER TABLE public.invoice_recurring_plans 
  ADD COLUMN IF NOT EXISTS auto_send_email BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS reminder_days_before INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'pix';

-- Add reminder tracking to invoices
ALTER TABLE public.invoices 
  ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_reminder_sent_at TIMESTAMPTZ;
