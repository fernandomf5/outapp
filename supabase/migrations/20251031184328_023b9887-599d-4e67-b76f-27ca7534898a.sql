-- Add ai_enabled column to track if AI is handling the conversation
ALTER TABLE agent_conversations 
ADD COLUMN IF NOT EXISTS ai_enabled boolean NOT NULL DEFAULT true;

ALTER TABLE chatbot_conversations 
ADD COLUMN IF NOT EXISTS ai_enabled boolean NOT NULL DEFAULT true;