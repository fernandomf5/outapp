-- Remove the overly permissive "Deny anonymous access" policies
DROP POLICY IF EXISTS "Deny anonymous access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Deny anonymous access to whatsapp_connections" ON public.whatsapp_connections;

-- The existing policies already ensure only authenticated users with proper permissions can access the data:
-- - Admins can view all (requires auth + admin role)
-- - Users can view their own (requires auth + matching user_id)