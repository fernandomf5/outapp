GRANT EXECUTE ON FUNCTION public.team_member_can(uuid, text, permission_action, uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.team_member_has_permission(uuid, text, permission_action) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_team_member_restrictions(uuid, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO anon, authenticated, service_role;