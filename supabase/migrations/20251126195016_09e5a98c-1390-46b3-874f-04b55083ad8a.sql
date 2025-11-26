-- Adicionar campos de cores personalizadas para simple_members_areas
ALTER TABLE simple_members_areas 
ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#8B5CF6',
ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#EC4899';