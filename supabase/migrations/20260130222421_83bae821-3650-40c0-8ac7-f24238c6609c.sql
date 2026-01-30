-- Add affiliate_url column to products table for affiliate products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS affiliate_url TEXT;