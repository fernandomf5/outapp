-- Add linked_user_id column to team_members to track which user accepted the invitation
ALTER TABLE public.team_members 
ADD COLUMN IF NOT EXISTS linked_user_id uuid REFERENCES auth.users(id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_team_members_linked_user_id ON public.team_members(linked_user_id);

-- Add RLS policy to allow team members to view their own linked member data
CREATE POLICY "Team members can view their linked records" 
ON public.team_members 
FOR SELECT 
USING (linked_user_id = auth.uid());