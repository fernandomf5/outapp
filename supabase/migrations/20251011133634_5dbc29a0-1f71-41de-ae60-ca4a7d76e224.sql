-- Ensure master admin role exists for the specified email
DO $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  SELECT u.id, 'admin'::public.app_role
  FROM auth.users u
  WHERE u.email = 'fernandomoraisgarcia2011@gmail.com'
    AND NOT EXISTS (
      SELECT 1 FROM public.user_roles r WHERE r.user_id = u.id AND r.role = 'admin'
    );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipping admin role insert: %', SQLERRM;
END $$;