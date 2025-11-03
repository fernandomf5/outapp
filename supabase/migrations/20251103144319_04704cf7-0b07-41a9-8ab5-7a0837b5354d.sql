-- Add product cost and revenue columns to ad_campaigns
ALTER TABLE ad_campaigns
ADD COLUMN product_cost numeric DEFAULT 0,
ADD COLUMN revenue numeric DEFAULT 0;