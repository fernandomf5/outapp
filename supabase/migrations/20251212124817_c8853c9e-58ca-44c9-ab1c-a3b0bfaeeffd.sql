-- Add images array column to portfolio_items for gallery support (up to 10 images)
ALTER TABLE public.portfolio_items 
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';

-- Add comment explaining the column
COMMENT ON COLUMN public.portfolio_items.images IS 'Array of image URLs for gallery (max 10 images)';