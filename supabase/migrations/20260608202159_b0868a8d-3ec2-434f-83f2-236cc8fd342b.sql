ALTER TABLE public.saved_qr_codes 
ADD COLUMN IF NOT EXISTS business_name TEXT,
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS logo_size INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS show_logo BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS border_color TEXT DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS show_border BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS border_width INTEGER DEFAULT 8,
ADD COLUMN IF NOT EXISTS corner_radius INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS padding INTEGER DEFAULT 16,
ADD COLUMN IF NOT EXISTS show_social_media BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS social_media JSONB DEFAULT '{}'::jsonb;

-- Grant access to existing roles (standard for Lovable migrations)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_qr_codes TO authenticated;
GRANT ALL ON public.saved_qr_codes TO service_role;