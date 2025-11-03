-- Adicionar colunas para mídia nas mensagens dos agentes
ALTER TABLE agent_messages
ADD COLUMN IF NOT EXISTS media_url TEXT,
ADD COLUMN IF NOT EXISTS media_type TEXT;

-- Criar bucket para chat-media se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-media', 'chat-media', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para chat-media
DROP POLICY IF EXISTS "Permitir upload de mídia no chat" ON storage.objects;
CREATE POLICY "Permitir upload de mídia no chat"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'chat-media');

DROP POLICY IF EXISTS "Permitir visualização pública de mídia do chat" ON storage.objects;
CREATE POLICY "Permitir visualização pública de mídia do chat"
ON storage.objects
FOR SELECT
USING (bucket_id = 'chat-media');

DROP POLICY IF EXISTS "Permitir exclusão de mídia no chat" ON storage.objects;
CREATE POLICY "Permitir exclusão de mídia no chat"
ON storage.objects
FOR DELETE
USING (bucket_id = 'chat-media');