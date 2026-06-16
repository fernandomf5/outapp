CREATE UNIQUE INDEX IF NOT EXISTS members_area_access_codes_unique_active_email_per_area
ON public.members_area_access_codes (members_area_id, lower(customer_email))
WHERE is_active = true AND customer_email IS NOT NULL;