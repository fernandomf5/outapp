-- Add slug column to members_areas table
ALTER TABLE members_areas 
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Create index for faster slug lookups
CREATE INDEX IF NOT EXISTS idx_members_areas_slug ON members_areas(slug);

-- Create members_area_access_requests table
CREATE TABLE IF NOT EXISTS members_area_access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id UUID NOT NULL REFERENCES members_areas(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID
);

-- Enable RLS
ALTER TABLE members_area_access_requests ENABLE ROW LEVEL SECURITY;

-- Policies for members_area_access_requests
CREATE POLICY "Anyone can submit access requests"
  ON members_area_access_requests FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Area owners can view all access requests for their areas"
  ON members_area_access_requests FOR SELECT
  USING (
    area_id IN (
      SELECT id FROM members_areas WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Area owners can update access requests for their areas"
  ON members_area_access_requests FOR UPDATE
  USING (
    area_id IN (
      SELECT id FROM members_areas WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Area owners can delete access requests for their areas"
  ON members_area_access_requests FOR DELETE
  USING (
    area_id IN (
      SELECT id FROM members_areas WHERE user_id = auth.uid()
    )
  );

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_access_requests_area ON members_area_access_requests(area_id);
CREATE INDEX IF NOT EXISTS idx_access_requests_email ON members_area_access_requests(email);
CREATE INDEX IF NOT EXISTS idx_access_requests_status ON members_area_access_requests(status);