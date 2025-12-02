-- Create table for floating multi-button configurations
CREATE TABLE public.floating_buttons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  main_button_text TEXT NOT NULL DEFAULT 'Contato',
  main_button_icon TEXT NOT NULL DEFAULT 'whatsapp',
  main_button_color TEXT NOT NULL DEFAULT '#25d366',
  position TEXT NOT NULL DEFAULT 'bottom-right',
  sub_buttons JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.floating_buttons ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own floating buttons"
ON public.floating_buttons
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own floating buttons"
ON public.floating_buttons
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own floating buttons"
ON public.floating_buttons
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own floating buttons"
ON public.floating_buttons
FOR DELETE
USING (auth.uid() = user_id);