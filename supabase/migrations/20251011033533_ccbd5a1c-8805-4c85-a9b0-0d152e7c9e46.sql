-- Create trigger to automatically assign admin role to specific user
CREATE OR REPLACE FUNCTION public.handle_new_user_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert profile for all users
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );

  -- Check if this is the admin master email
  IF NEW.email = 'fernandomoraisgarcia2011@gmail.com' THEN
    -- Assign admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  ELSE
    -- Assign regular user role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');

    -- Create free trial subscription for regular users
    INSERT INTO public.subscriptions (user_id, plan_id, status, expires_at)
    SELECT 
      NEW.id,
      p.id,
      'active',
      NOW() + INTERVAL '3 days'
    FROM public.plans p
    WHERE p.plan_type = 'free_trial'
    LIMIT 1;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for new user signups
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_admin();