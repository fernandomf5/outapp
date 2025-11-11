-- Add access_code field to members_area_access_requests
ALTER TABLE members_area_access_requests 
ADD COLUMN IF NOT EXISTS access_code TEXT;

-- Create unique access codes function
CREATE OR REPLACE FUNCTION generate_access_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  done BOOL;
BEGIN
  done := false;
  WHILE NOT done LOOP
    code := upper(substring(md5(random()::text) from 1 for 8));
    done := NOT EXISTS(SELECT 1 FROM members_area_access_requests WHERE access_code = code);
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Update members_area_enrollments to link with access requests
ALTER TABLE members_area_enrollments 
ADD COLUMN IF NOT EXISTS access_request_id UUID REFERENCES members_area_access_requests(id) ON DELETE CASCADE;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_enrollments_access_request ON members_area_enrollments(access_request_id);
CREATE INDEX IF NOT EXISTS idx_access_requests_code ON members_area_access_requests(access_code);

-- Enable RLS on enrollments
ALTER TABLE members_area_enrollments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own enrollments" ON members_area_enrollments;
DROP POLICY IF EXISTS "Area owners can view enrollments" ON members_area_enrollments;
DROP POLICY IF EXISTS "Area owners can manage enrollments" ON members_area_enrollments;
DROP POLICY IF EXISTS "Public can create enrollments" ON members_area_enrollments;

-- Create new policies
CREATE POLICY "Users can view their own enrollments"
  ON members_area_enrollments FOR SELECT
  USING (user_email = (SELECT email FROM members_area_access_requests WHERE id = access_request_id));

CREATE POLICY "Area owners can view enrollments"
  ON members_area_enrollments FOR SELECT
  USING (
    area_id IN (
      SELECT id FROM members_areas WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Area owners can manage enrollments"
  ON members_area_enrollments FOR ALL
  USING (
    area_id IN (
      SELECT id FROM members_areas WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Public can create enrollments"
  ON members_area_enrollments FOR INSERT
  WITH CHECK (true);