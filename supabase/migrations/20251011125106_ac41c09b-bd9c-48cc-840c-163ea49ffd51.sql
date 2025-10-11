-- Drop existing SELECT policies on profiles table
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Recreate policies with explicit anonymous access denial
CREATE POLICY "Deny anonymous access to profiles"
ON public.profiles
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);