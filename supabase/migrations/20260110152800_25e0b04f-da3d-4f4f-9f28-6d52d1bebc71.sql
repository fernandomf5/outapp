-- Create storage bucket for dispatcher media
INSERT INTO storage.buckets (id, name, public)
VALUES ('dispatcher-media', 'dispatcher-media', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for dispatcher-media bucket
CREATE POLICY "Users can upload their own dispatcher media"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'dispatcher-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own dispatcher media"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'dispatcher-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own dispatcher media"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'dispatcher-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Make dispatcher media publicly accessible for sharing
CREATE POLICY "Public read access for dispatcher media"
ON storage.objects
FOR SELECT
USING (bucket_id = 'dispatcher-media');