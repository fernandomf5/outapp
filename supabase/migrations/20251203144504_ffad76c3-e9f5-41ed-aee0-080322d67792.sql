-- Add attendant_status column to ai_agents table
ALTER TABLE public.ai_agents 
ADD COLUMN IF NOT EXISTS attendant_status text NOT NULL DEFAULT 'offline';

-- Add attendant_name column to ai_agents table
ALTER TABLE public.ai_agents 
ADD COLUMN IF NOT EXISTS attendant_name text;