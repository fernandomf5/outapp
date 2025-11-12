-- Remove collect_visitor_name column from briefings
ALTER TABLE public.briefings DROP COLUMN IF EXISTS collect_visitor_name;

-- Make visitor_name required in briefing_responses
ALTER TABLE public.briefing_responses 
ALTER COLUMN visitor_name SET NOT NULL;