-- Rename column to better reflect its purpose (controls visibility everywhere)
ALTER TABLE plans 
RENAME COLUMN visible_on_landing TO is_visible;

-- Add comment to clarify the column's purpose
COMMENT ON COLUMN plans.is_visible IS 'Controls visibility on landing page and user dashboard panels';