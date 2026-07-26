CREATE POLICY "Public capture form uploads"
ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id = 'blog-images' AND (storage.foldername(name))[1] = 'capture');