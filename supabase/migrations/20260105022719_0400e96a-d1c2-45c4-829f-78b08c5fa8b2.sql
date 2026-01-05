-- Add RLS policy for team members to view customers delegated via tasks module
CREATE POLICY "Team members can view delegated customers for tasks"
ON public.customers
FOR SELECT
USING (
  team_member_can(user_id, 'tasks'::text, 'read'::permission_action, id)
);

-- Also add policies for CRM module (since customers are used in CRM too)
CREATE POLICY "Team members can view delegated customers for crm"
ON public.customers
FOR SELECT
USING (
  team_member_can(user_id, 'crm'::text, 'read'::permission_action, id)
);