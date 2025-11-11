-- Add thumbnail_url column to members_area_modules table
ALTER TABLE members_area_modules 
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;