-- Add is_blocked column to briefings table
ALTER TABLE briefings ADD COLUMN is_blocked boolean DEFAULT false NOT NULL;