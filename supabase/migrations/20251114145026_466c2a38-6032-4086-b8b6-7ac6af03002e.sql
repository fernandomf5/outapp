-- Add end_date column to ad_campaigns table
ALTER TABLE public.ad_campaigns
ADD COLUMN IF NOT EXISTS end_date DATE;