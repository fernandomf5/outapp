-- Fix search_path for the increment function
CREATE OR REPLACE FUNCTION increment_cloned_page_clicks()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE cloned_pages
  SET clicks = clicks + 1
  WHERE id = NEW.page_id;
  RETURN NEW;
END;
$$;