
-- Add business_id to script_categories
ALTER TABLE public.script_categories 
ADD COLUMN IF NOT EXISTS business_id uuid REFERENCES public.businesses(id) ON DELETE SET NULL;

-- Add business_id to saved_scripts
ALTER TABLE public.saved_scripts 
ADD COLUMN IF NOT EXISTS business_id uuid REFERENCES public.businesses(id) ON DELETE SET NULL;
