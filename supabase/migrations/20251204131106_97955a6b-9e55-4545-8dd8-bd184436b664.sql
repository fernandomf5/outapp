-- Create personal agenda events table
CREATE TABLE public.agenda_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  all_day BOOLEAN DEFAULT false,
  color TEXT DEFAULT '#6366f1',
  reminder_minutes INTEGER DEFAULT 15,
  reminder_shown BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agenda_events ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own agenda events"
ON public.agenda_events
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_agenda_events_user_date ON public.agenda_events(user_id, start_date);
CREATE INDEX idx_agenda_events_reminder ON public.agenda_events(user_id, reminder_shown, start_date);