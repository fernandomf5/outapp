-- Add new columns to websites table for advanced features
ALTER TABLE public.websites 
ADD COLUMN IF NOT EXISTS site_type text DEFAULT 'landing',
ADD COLUMN IF NOT EXISTS header jsonb DEFAULT '{"show_logo": true, "menu_items": [], "cta_button": {"text": "", "link": ""}}'::jsonb,
ADD COLUMN IF NOT EXISTS footer jsonb DEFAULT '{"copyright": "", "social_links": [], "columns": []}'::jsonb,
ADD COLUMN IF NOT EXISTS products jsonb DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.websites.site_type IS 'Type of website: landing, business, portfolio, catalog';
COMMENT ON COLUMN public.websites.header IS 'Header configuration with logo, menu, and CTA button';
COMMENT ON COLUMN public.websites.footer IS 'Footer configuration with copyright, social links, and columns';
COMMENT ON COLUMN public.websites.products IS 'Products array for catalog sites with payment links';