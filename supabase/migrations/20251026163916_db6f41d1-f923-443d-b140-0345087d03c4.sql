-- Add image_url column to agent_services table
ALTER TABLE agent_services ADD COLUMN IF NOT EXISTS image_url text;