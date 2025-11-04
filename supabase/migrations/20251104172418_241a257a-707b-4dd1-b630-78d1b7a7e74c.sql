-- Add missing columns to members_areas table
ALTER TABLE public.members_areas 
ADD COLUMN IF NOT EXISTS banner_url TEXT,
ADD COLUMN IF NOT EXISTS custom_domain TEXT;

-- Add missing columns to members_area_modules table
ALTER TABLE public.members_area_modules
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT 'video',
ADD COLUMN IF NOT EXISTS content_data TEXT,
ADD COLUMN IF NOT EXISTS category TEXT;

-- Create storage bucket for members content
INSERT INTO storage.buckets (id, name, public)
VALUES ('members-content', 'members-content', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can upload members content" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view members content" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own members content" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own members content" ON storage.objects;

-- Storage policies for members content
CREATE POLICY "Authenticated users can upload members content"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'members-content');

CREATE POLICY "Anyone can view members content"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'members-content');

CREATE POLICY "Users can update their own members content"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'members-content' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own members content"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'members-content' AND auth.uid()::text = (storage.foldername(name))[1]);