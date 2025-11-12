-- Adicionar coluna para coletar nome do respondente no briefing
ALTER TABLE briefings 
ADD COLUMN IF NOT EXISTS collect_visitor_name boolean DEFAULT false;

-- Adicionar coluna para armazenar o nome do visitante nas respostas
ALTER TABLE briefing_responses 
ADD COLUMN IF NOT EXISTS visitor_name text;