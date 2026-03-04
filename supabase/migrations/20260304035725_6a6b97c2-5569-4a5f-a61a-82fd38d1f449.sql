ALTER TABLE public.simple_members_areas 
ADD COLUMN access_type text NOT NULL DEFAULT 'password';

COMMENT ON COLUMN public.simple_members_areas.access_type IS 'password = senha manual, email_code = código enviado por email após compra';