-- Add design columns to simple_members_areas table
ALTER TABLE simple_members_areas 
ADD COLUMN IF NOT EXISTS background_color TEXT DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS text_color TEXT DEFAULT '#1f2937',
ADD COLUMN IF NOT EXISTS card_background_color TEXT DEFAULT '#f9fafb',
ADD COLUMN IF NOT EXISTS card_text_color TEXT DEFAULT '#374151',
ADD COLUMN IF NOT EXISTS header_background_color TEXT DEFAULT '#f3f4f6',
ADD COLUMN IF NOT EXISTS accent_color TEXT DEFAULT '#8B5CF6';