-- Create bucket for business logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('business-logos', 'business-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own business logos
CREATE POLICY "Users can upload business logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'business-logos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to update their own business logos
CREATE POLICY "Users can update their business logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'business-logos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to delete their own business logos
CREATE POLICY "Users can delete their business logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'business-logos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access to business logos
CREATE POLICY "Public can view business logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'business-logos');