-- Add new columns to cloned_pages table
ALTER TABLE cloned_pages 
ADD COLUMN IF NOT EXISTS custom_domain text,
ADD COLUMN IF NOT EXISTS clicks integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS slug text;

-- Create unique index on slug
CREATE UNIQUE INDEX IF NOT EXISTS cloned_pages_slug_idx ON cloned_pages(slug) WHERE slug IS NOT NULL;

-- Create table for tracking page clone clicks
CREATE TABLE IF NOT EXISTS cloned_page_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid REFERENCES cloned_pages(id) ON DELETE CASCADE,
  visitor_id text,
  ip_address text,
  user_agent text,
  referrer text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on cloned_page_clicks
ALTER TABLE cloned_page_clicks ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own page clicks
CREATE POLICY "Users can view clicks on their pages"
  ON cloned_page_clicks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM cloned_pages
      WHERE cloned_pages.id = cloned_page_clicks.page_id
      AND cloned_pages.user_id = auth.uid()
    )
  );

-- Policy for public to create clicks
CREATE POLICY "Public can create clicks"
  ON cloned_page_clicks
  FOR INSERT
  WITH CHECK (true);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS cloned_page_clicks_page_id_idx ON cloned_page_clicks(page_id);
CREATE INDEX IF NOT EXISTS cloned_page_clicks_created_at_idx ON cloned_page_clicks(created_at);

-- Function to increment click count
CREATE OR REPLACE FUNCTION increment_cloned_page_clicks()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE cloned_pages
  SET clicks = clicks + 1
  WHERE id = NEW.page_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-increment clicks
DROP TRIGGER IF EXISTS increment_cloned_page_clicks_trigger ON cloned_page_clicks;
CREATE TRIGGER increment_cloned_page_clicks_trigger
  AFTER INSERT ON cloned_page_clicks
  FOR EACH ROW
  EXECUTE FUNCTION increment_cloned_page_clicks();