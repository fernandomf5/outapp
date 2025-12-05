-- Add color customization columns to aprova_job_clients
ALTER TABLE public.aprova_job_clients 
ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#8B5CF6',
ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#6366F1';