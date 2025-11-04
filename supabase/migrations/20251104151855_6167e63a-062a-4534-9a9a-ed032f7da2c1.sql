-- Create members_areas table if not exists
CREATE TABLE IF NOT EXISTS public.members_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  banner_url TEXT,
  logo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.members_areas ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own members areas"
ON public.members_areas
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create members_area_modules table if not exists
CREATE TABLE IF NOT EXISTS public.members_area_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  members_area_id UUID NOT NULL REFERENCES public.members_areas(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.members_area_modules ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage modules in their areas"
ON public.members_area_modules
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.members_areas 
  WHERE id = members_area_modules.members_area_id 
  AND user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.members_areas 
  WHERE id = members_area_modules.members_area_id 
  AND user_id = auth.uid()
));

-- Update trigger
CREATE OR REPLACE FUNCTION update_members_areas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER members_areas_updated_at
BEFORE UPDATE ON public.members_areas
FOR EACH ROW
EXECUTE FUNCTION update_members_areas_updated_at();

CREATE TRIGGER members_area_modules_updated_at
BEFORE UPDATE ON public.members_area_modules
FOR EACH ROW
EXECUTE FUNCTION update_members_areas_updated_at();