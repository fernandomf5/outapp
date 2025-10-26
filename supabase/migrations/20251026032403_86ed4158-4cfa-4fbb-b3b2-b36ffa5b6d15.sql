-- Add proposed_date field to agent_appointments for date change suggestions
ALTER TABLE agent_appointments 
ADD COLUMN proposed_date timestamp with time zone,
ADD COLUMN response_type text;

-- Update status values to include pending_approval
COMMENT ON COLUMN agent_appointments.status IS 'Status values: pending_approval, pending, confirmed, cancelled, completed';
COMMENT ON COLUMN agent_appointments.proposed_date IS 'New date proposed by agent owner when original date is not available';
COMMENT ON COLUMN agent_appointments.response_type IS 'Type of response from agent owner: approved, rejected, date_change';