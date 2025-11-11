-- Add new columns to members_areas table for advanced features
ALTER TABLE public.members_areas 
ADD COLUMN IF NOT EXISTS area_type text DEFAULT 'course',
ADD COLUMN IF NOT EXISTS products jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS access_rules jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS welcome_message text,
ADD COLUMN IF NOT EXISTS custom_domain text;

-- Add comment for documentation
COMMENT ON COLUMN public.members_areas.area_type IS 'Type of area: course, community, client_portal, digital_products';
COMMENT ON COLUMN public.members_areas.products IS 'Products array for selling within the members area';
COMMENT ON COLUMN public.members_areas.access_rules IS 'Rules for automatic content release based on purchases';
COMMENT ON COLUMN public.members_areas.welcome_message IS 'Welcome message shown to members';
COMMENT ON COLUMN public.members_areas.custom_domain IS 'Custom domain for the members area';

-- Update modules table to support access control
ALTER TABLE public.members_area_modules
ADD COLUMN IF NOT EXISTS required_product_id text,
ADD COLUMN IF NOT EXISTS is_locked boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS unlock_after_days integer DEFAULT 0;

COMMENT ON COLUMN public.members_area_modules.required_product_id IS 'Product ID required to access this module';
COMMENT ON COLUMN public.members_area_modules.is_locked IS 'Whether this module is locked by default';
COMMENT ON COLUMN public.members_area_modules.unlock_after_days IS 'Days after enrollment to auto-unlock';

-- Create table for member enrollments and purchases
CREATE TABLE IF NOT EXISTS public.members_area_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id uuid NOT NULL REFERENCES public.members_areas(id) ON DELETE CASCADE,
  user_email text NOT NULL,
  user_name text,
  enrolled_at timestamp with time zone NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'active',
  purchased_products jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.members_area_enrollments ENABLE ROW LEVEL SECURITY;

-- RLS policies for enrollments
CREATE POLICY "Area owners can manage enrollments"
  ON public.members_area_enrollments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.members_areas
      WHERE members_areas.id = members_area_enrollments.area_id
      AND members_areas.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own enrollments"
  ON public.members_area_enrollments
  FOR SELECT
  USING (user_email = auth.email());

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_enrollments_area_id ON public.members_area_enrollments(area_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_email ON public.members_area_enrollments(user_email);