INSERT INTO public.site_settings (key, value) VALUES
 ('site_logo_url', '/__l5e/assets-v1/60ab6198-490e-474c-9538-390965d932c5/logo-outapp.png'),
 ('site_logo_dark_url', '/__l5e/assets-v1/60ab6198-490e-474c-9538-390965d932c5/logo-outapp.png'),
 ('site_logo_light_url', '/__l5e/assets-v1/60ab6198-490e-474c-9538-390965d932c5/logo-outapp.png')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;