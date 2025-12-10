-- Add destination email and whatsapp columns to briefings table
ALTER TABLE public.briefings 
ADD COLUMN IF NOT EXISTS destination_email TEXT,
ADD COLUMN IF NOT EXISTS destination_whatsapp TEXT;