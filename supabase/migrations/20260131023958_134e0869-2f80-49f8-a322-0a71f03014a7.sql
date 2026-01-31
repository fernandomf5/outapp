-- Drop tables from the old members area system (keeping only simple_members_areas)
-- First drop tables with foreign key dependencies

DROP TABLE IF EXISTS public.members_ticket_messages CASCADE;
DROP TABLE IF EXISTS public.members_support_tickets CASCADE;
DROP TABLE IF EXISTS public.members_product_licenses CASCADE;
DROP TABLE IF EXISTS public.members_digital_downloads CASCADE;
DROP TABLE IF EXISTS public.members_course_progress CASCADE;
DROP TABLE IF EXISTS public.members_contents CASCADE;
DROP TABLE IF EXISTS public.members_community_likes CASCADE;
DROP TABLE IF EXISTS public.members_community_comments CASCADE;
DROP TABLE IF EXISTS public.members_community_posts CASCADE;
DROP TABLE IF EXISTS public.members_client_documents CASCADE;
DROP TABLE IF EXISTS public.members_certificates CASCADE;
DROP TABLE IF EXISTS public.members_modules CASCADE;
DROP TABLE IF EXISTS public.members_area_progress CASCADE;
DROP TABLE IF EXISTS public.members_area_subscriptions CASCADE;
DROP TABLE IF EXISTS public.members_area_module_contents CASCADE;
DROP TABLE IF EXISTS public.members_area_modules CASCADE;
DROP TABLE IF EXISTS public.members_area_enrollments CASCADE;
DROP TABLE IF EXISTS public.members_area_access_requests CASCADE;
DROP TABLE IF EXISTS public.members_areas CASCADE;