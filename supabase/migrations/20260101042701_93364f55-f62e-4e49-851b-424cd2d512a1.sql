-- Allow team members (linked users) to access delegated resources via RLS

-- Helper function: checks if current auth user can perform an action on a delegated resource
CREATE OR REPLACE FUNCTION public.team_member_can(
  p_admin_user_id uuid,
  p_module_key text,
  p_required_action public.permission_action,
  p_resource_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_team_member_id uuid;
  v_restrictions jsonb;
BEGIN
  -- Must be authenticated in Supabase Auth
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  -- Owner always allowed
  IF auth.uid() = p_admin_user_id THEN
    RETURN true;
  END IF;

  -- Must be an active linked team member of the owner
  SELECT tm.id
    INTO v_team_member_id
  FROM public.team_members tm
  WHERE tm.user_id = p_admin_user_id
    AND tm.linked_user_id = auth.uid()
    AND tm.status = 'active'
  LIMIT 1;

  IF v_team_member_id IS NULL THEN
    RETURN false;
  END IF;

  -- Must have the required permission
  SELECT COALESCE(tmp.restrictions, '{}'::jsonb)
    INTO v_restrictions
  FROM public.team_member_permissions tmp
  WHERE tmp.team_member_id = v_team_member_id
    AND tmp.module_key = p_module_key
    AND tmp.action = p_required_action
    AND tmp.is_allowed = true
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- If no specific resource is being checked, permission is enough
  IF p_resource_id IS NULL THEN
    RETURN true;
  END IF;

  -- If no allowed_ids restriction, allow all resources under that module
  IF NOT (v_restrictions ? 'allowed_ids') THEN
    RETURN true;
  END IF;

  IF jsonb_typeof(v_restrictions->'allowed_ids') <> 'array' THEN
    RETURN true;
  END IF;

  IF jsonb_array_length(v_restrictions->'allowed_ids') = 0 THEN
    RETURN true;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM jsonb_array_elements_text(v_restrictions->'allowed_ids') AS v(val)
    WHERE v.val = p_resource_id::text
  );
END;
$$;

-- AI Agents (Chat Online)
DROP POLICY IF EXISTS "Team members can read delegated AI agents" ON public.ai_agents;
CREATE POLICY "Team members can read delegated AI agents"
ON public.ai_agents
FOR SELECT
USING (
  public.team_member_can(user_id, 'ai_agents', 'read'::public.permission_action, id)
);

-- Optional: allow updates/deletes only when delegated (keeps behavior consistent)
DROP POLICY IF EXISTS "Team members can update delegated AI agents" ON public.ai_agents;
CREATE POLICY "Team members can update delegated AI agents"
ON public.ai_agents
FOR UPDATE
USING (
  public.team_member_can(user_id, 'ai_agents', 'update'::public.permission_action, id)
)
WITH CHECK (
  public.team_member_can(user_id, 'ai_agents', 'update'::public.permission_action, id)
);

DROP POLICY IF EXISTS "Team members can delete delegated AI agents" ON public.ai_agents;
CREATE POLICY "Team members can delete delegated AI agents"
ON public.ai_agents
FOR DELETE
USING (
  public.team_member_can(user_id, 'ai_agents', 'delete'::public.permission_action, id)
);

-- Agent notifications (for badge counts)
DROP POLICY IF EXISTS "Team members can read delegated agent notifications" ON public.agent_notifications;
CREATE POLICY "Team members can read delegated agent notifications"
ON public.agent_notifications
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.ai_agents a
    WHERE a.id = agent_notifications.agent_id
      AND public.team_member_can(a.user_id, 'ai_agents', 'read'::public.permission_action, a.id)
  )
);

-- Agent appointments (for badge counts)
DROP POLICY IF EXISTS "Team members can read delegated agent appointments" ON public.agent_appointments;
CREATE POLICY "Team members can read delegated agent appointments"
ON public.agent_appointments
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.ai_agents a
    WHERE a.id = agent_appointments.agent_id
      AND public.team_member_can(a.user_id, 'ai_agents', 'read'::public.permission_action, a.id)
  )
);

-- Agent orders (for badge counts)
DROP POLICY IF EXISTS "Team members can read delegated agent orders" ON public.agent_orders;
CREATE POLICY "Team members can read delegated agent orders"
ON public.agent_orders
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.ai_agents a
    WHERE a.id = agent_orders.agent_id
      AND public.team_member_can(a.user_id, 'ai_agents', 'read'::public.permission_action, a.id)
  )
);
