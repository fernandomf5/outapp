-- Add gallery_urls column to user_services for multiple images
ALTER TABLE public.user_services ADD COLUMN IF NOT EXISTS gallery_urls jsonb DEFAULT '[]'::jsonb;

-- Add description_html column to products for rich text description
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description_html text;

-- Add description_html column to user_services for rich text description  
ALTER TABLE public.user_services ADD COLUMN IF NOT EXISTS description_html text;