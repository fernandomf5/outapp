-- Criar bucket para arquivos dos chatbots (se não existir)
INSERT INTO storage.buckets (id, name, public)
VALUES ('chatbot-media', 'chatbot-media', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de acesso para o bucket chatbot-media
-- Permitir que usuários autenticados façam upload
CREATE POLICY "Authenticated users can upload chatbot media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chatbot-media');

-- Permitir que qualquer pessoa visualize os arquivos (bucket público)
CREATE POLICY "Public can view chatbot media"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'chatbot-media');

-- Permitir que usuários autenticados atualizem seus próprios arquivos
CREATE POLICY "Users can update their own chatbot media"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'chatbot-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Permitir que usuários autenticados excluam seus próprios arquivos
CREATE POLICY "Users can delete their own chatbot media"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'chatbot-media' AND auth.uid()::text = (storage.foldername(name))[1]);