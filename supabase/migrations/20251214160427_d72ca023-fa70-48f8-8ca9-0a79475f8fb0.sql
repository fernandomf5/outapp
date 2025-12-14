-- Add steps support column to briefings table
ALTER TABLE public.briefings 
ADD COLUMN IF NOT EXISTS use_steps boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS step_labels jsonb DEFAULT '[]'::jsonb;