-- Allow public read access to active cloned pages
CREATE POLICY "Public can view active cloned pages"
ON public.cloned_pages
FOR SELECT
USING (is_active = true);