-- Força a atribuição do papel admin para a conta master
UPDATE public.user_roles 
SET role = 'admin'::public.app_role
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'fernandomoraisgarcia2011@gmail.com'
);

-- Se não existir, cria o registro
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role 
FROM auth.users 
WHERE email = 'fernandomoraisgarcia2011@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = (SELECT id FROM auth.users WHERE email = 'fernandomoraisgarcia2011@gmail.com')
  );