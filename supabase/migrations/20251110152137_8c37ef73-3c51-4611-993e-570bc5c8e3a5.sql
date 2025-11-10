-- Add column to control plan visibility on landing page
ALTER TABLE plans 
ADD COLUMN IF NOT EXISTS visible_on_landing BOOLEAN DEFAULT true;

-- Update existing plans to be visible by default
UPDATE plans 
SET visible_on_landing = true 
WHERE visible_on_landing IS NULL;