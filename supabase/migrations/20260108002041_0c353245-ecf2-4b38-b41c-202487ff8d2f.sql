-- Create storage bucket for cloned pages
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('cloned-pages', 'cloned-pages', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'])
ON CONFLICT (id) DO NOTHING;

-- Policy for public read access
CREATE POLICY "Public read access for cloned-pages"
ON storage.objects FOR SELECT
USING (bucket_id = 'cloned-pages');

-- Policy for authenticated users to upload
CREATE POLICY "Authenticated users can upload to cloned-pages"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'cloned-pages');

-- Policy for authenticated users to update their files
CREATE POLICY "Authenticated users can update cloned-pages files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'cloned-pages');

-- Policy for authenticated users to delete their files
CREATE POLICY "Authenticated users can delete cloned-pages files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'cloned-pages');