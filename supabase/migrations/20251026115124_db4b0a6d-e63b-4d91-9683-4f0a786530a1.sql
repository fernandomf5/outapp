-- Atualizar constraints para incluir 'anonymous' como tipo de acesso
ALTER TABLE public.chatbots 
DROP CONSTRAINT IF EXISTS chatbots_access_type_check;

ALTER TABLE public.chatbots 
ADD CONSTRAINT chatbots_access_type_check 
CHECK (access_type IN ('public', 'private', 'anonymous'));

ALTER TABLE public.ai_agents 
DROP CONSTRAINT IF EXISTS ai_agents_access_type_check;

ALTER TABLE public.ai_agents 
ADD CONSTRAINT ai_agents_access_type_check 
CHECK (access_type IN ('public', 'private', 'anonymous'));