-- Criar bucket para mídia do chatbot se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('chatbot-media', 'chatbot-media', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para mídia do chatbot
CREATE POLICY "Permitir upload público de imagens"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'chatbot-media');

CREATE POLICY "Permitir leitura pública de imagens"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'chatbot-media');

CREATE POLICY "Permitir atualização pública de imagens"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'chatbot-media');

CREATE POLICY "Permitir exclusão pública de imagens"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'chatbot-media');