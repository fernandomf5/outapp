CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE public.members_area_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  members_area_id UUID NOT NULL REFERENCES public.simple_members_areas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  customer_name TEXT,
  customer_email TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT members_area_users_username_unique UNIQUE (members_area_id, username)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.members_area_users TO authenticated;
GRANT ALL ON public.members_area_users TO service_role;

ALTER TABLE public.members_area_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their members area users"
ON public.members_area_users
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_members_area_users_updated_at
BEFORE UPDATE ON public.members_area_users
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();