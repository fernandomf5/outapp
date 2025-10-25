-- Add gradient color columns to link_bios table
ALTER TABLE link_bios 
ADD COLUMN IF NOT EXISTS gradient_color1 TEXT DEFAULT '#667eea',
ADD COLUMN IF NOT EXISTS gradient_color2 TEXT DEFAULT '#764ba2';