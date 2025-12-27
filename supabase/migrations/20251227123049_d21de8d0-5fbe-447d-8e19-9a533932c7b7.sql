-- Create team invitations table
CREATE TABLE public.team_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL,
  invited_email TEXT NOT NULL,
  invitation_token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  accepted_by_user_id UUID,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  accepted_at TIMESTAMP WITH TIME ZONE
);

-- Add invitation_id column to team_members if not exists
ALTER TABLE public.team_members 
ADD COLUMN IF NOT EXISTS invitation_id UUID;

-- Create indexes
CREATE INDEX idx_team_invitations_admin ON public.team_invitations(admin_user_id);
CREATE INDEX idx_team_invitations_email ON public.team_invitations(invited_email);
CREATE INDEX idx_team_invitations_token ON public.team_invitations(invitation_token);

-- Enable RLS
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- RLS policies for team_invitations
CREATE POLICY "Users can view invitations they sent" 
ON public.team_invitations 
FOR SELECT 
USING (auth.uid() = admin_user_id);

CREATE POLICY "Users can create invitations" 
ON public.team_invitations 
FOR INSERT 
WITH CHECK (auth.uid() = admin_user_id);

CREATE POLICY "Users can update their invitations" 
ON public.team_invitations 
FOR UPDATE 
USING (auth.uid() = admin_user_id);

CREATE POLICY "Users can delete their invitations" 
ON public.team_invitations 
FOR DELETE 
USING (auth.uid() = admin_user_id);

-- Policy for invited users to view and accept their invitations (using service role for acceptance)
CREATE POLICY "Invited users can view their pending invitations" 
ON public.team_invitations 
FOR SELECT 
USING (status = 'pending');

-- Update team_members policies to include user_id access
CREATE POLICY "Team members can view their own membership" 
ON public.team_members 
FOR SELECT 
USING (user_id = auth.uid());

-- Drop old credentials and sessions tables (no longer needed)
DROP TABLE IF EXISTS public.team_member_sessions CASCADE;
DROP TABLE IF EXISTS public.team_member_credentials CASCADE;