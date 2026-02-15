
-- Add area_type column to simple_members_areas
-- 'course' = shows progress tracking (default for backwards compatibility)
-- 'exclusive' = exclusive area without progress tracking
ALTER TABLE public.simple_members_areas 
ADD COLUMN area_type text NOT NULL DEFAULT 'course';

-- Add customer_name column for personalized greeting
ALTER TABLE public.simple_members_areas 
ADD COLUMN customer_name text;
