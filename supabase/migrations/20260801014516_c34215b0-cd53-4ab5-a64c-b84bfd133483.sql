ALTER TABLE public.simple_members_areas REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.simple_members_areas;