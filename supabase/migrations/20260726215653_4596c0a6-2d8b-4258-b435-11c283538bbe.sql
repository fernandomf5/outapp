CREATE OR REPLACE FUNCTION public.increment_capture_page_view(_page_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.capture_pages
  SET views = views + 1
  WHERE id = _page_id AND is_published = true;
$$;

GRANT EXECUTE ON FUNCTION public.increment_capture_page_view(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.increment_capture_page_conversion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.capture_pages
  SET conversions = conversions + 1
  WHERE id = NEW.page_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER capture_leads_increment_conversion
AFTER INSERT ON public.capture_leads
FOR EACH ROW EXECUTE FUNCTION public.increment_capture_page_conversion();