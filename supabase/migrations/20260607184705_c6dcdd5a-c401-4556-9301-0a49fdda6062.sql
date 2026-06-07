-- Delete duplicate categories keeping only the oldest one (min id) per name/user_id/system_type
DELETE FROM public.registration_categories a
USING public.registration_categories b
WHERE a.id > b.id 
  AND a.name = b.name 
  AND a.user_id = b.user_id 
  AND (a.system_type = b.system_type OR (a.system_type IS NULL AND b.system_type IS NULL));

-- Optional: Add a unique constraint to prevent this in the future
-- ALTER TABLE public.registration_categories ADD CONSTRAINT unique_user_category_name UNIQUE (user_id, name);
