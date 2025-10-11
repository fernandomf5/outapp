-- Drop the overly permissive INSERT policy on subscriptions
DROP POLICY IF EXISTS "System can insert subscriptions" ON public.subscriptions;

-- Create a secure policy that only allows admins to manually insert subscriptions
-- The trigger function handle_new_user_admin() uses SECURITY DEFINER so it will bypass RLS
CREATE POLICY "Only admins can insert subscriptions"
ON public.subscriptions
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
);