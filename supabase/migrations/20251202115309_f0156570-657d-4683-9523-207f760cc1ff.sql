-- Adicionar campos de customização de cores ao briefing
ALTER TABLE briefings 
ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#8B5CF6',
ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#EC4899';