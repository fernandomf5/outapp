-- Create storage bucket for portfolio images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolio-images', 'portfolio-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own images
CREATE POLICY "Users can upload portfolio images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'portfolio-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public access to view portfolio images
CREATE POLICY "Portfolio images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'portfolio-images');

-- Allow users to update their own portfolio images
CREATE POLICY "Users can update their own portfolio images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'portfolio-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own portfolio images
CREATE POLICY "Users can delete their own portfolio images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'portfolio-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);