-- Drop existing SELECT policies on whatsapp_connections table
DROP POLICY IF EXISTS "Admins can view all connections" ON public.whatsapp_connections;
DROP POLICY IF EXISTS "Users can view their own connections" ON public.whatsapp_connections;

-- Recreate policies with explicit anonymous access denial
CREATE POLICY "Deny anonymous access to whatsapp_connections"
ON public.whatsapp_connections
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can view all connections"
ON public.whatsapp_connections
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Users can view their own connections"
ON public.whatsapp_connections
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);