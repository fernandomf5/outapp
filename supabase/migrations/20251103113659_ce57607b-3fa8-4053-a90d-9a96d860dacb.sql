-- Add last_read_by_owner_at columns to track when agent/chatbot owner last viewed the conversation
ALTER TABLE public.agent_conversations 
ADD COLUMN IF NOT EXISTS last_read_by_owner_at timestamp with time zone;

ALTER TABLE public.chatbot_conversations 
ADD COLUMN IF NOT EXISTS last_read_by_owner_at timestamp with time zone;