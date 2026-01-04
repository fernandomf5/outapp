
-- Add RLS policy for team members to access delegated financial categories
-- Using the existing team_member_can pattern for consistency
CREATE POLICY "Team members can read delegated financial categories" 
ON public.financial_categories 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM team_members tm
    JOIN team_member_permissions tmp ON tmp.team_member_id = tm.id
    WHERE tm.linked_user_id = auth.uid()
    AND tm.user_id = financial_categories.user_id
    AND tm.status = 'active'
    AND tmp.module_key = 'financial'
    AND tmp.action = 'read'
    AND tmp.is_allowed = true
  )
);
