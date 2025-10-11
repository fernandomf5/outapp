-- Adicionar suporte para imagens e conteúdo rico nas mensagens
ALTER TABLE admin_messages 
ADD COLUMN IF NOT EXISTS image_url text,
ADD COLUMN IF NOT EXISTS content_html text;