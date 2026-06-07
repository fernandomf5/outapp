-- Create registration_categories table
CREATE TABLE public.registration_categories (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon TEXT, -- Lucide icon name
    color TEXT DEFAULT '#3b82f6',
    system_type TEXT, -- 'client', 'business', 'team', 'supplier', etc.
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add registration_category_id to entities
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS registration_category_id UUID REFERENCES public.registration_categories(id) ON DELETE SET NULL;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS registration_category_id UUID REFERENCES public.registration_categories(id) ON DELETE SET NULL;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS registration_category_id UUID REFERENCES public.registration_categories(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.registration_categories ENABLE ROW LEVEL SECURITY;

-- Policies for registration_categories
CREATE POLICY "Users can manage their own registration categories" 
ON public.registration_categories FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.registration_categories TO authenticated;
GRANT ALL ON public.registration_categories TO service_role;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_registration_categories_updated_at
BEFORE UPDATE ON public.registration_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed some default categories for existing users (optional, but might be helpful)
-- Note: In a real app, this would be done on user signup.
-- For now, let's just leave it empty and let the UI handle it.
