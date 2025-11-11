-- Criar bucket para logos de briefing
INSERT INTO storage.buckets (id, name, public)
VALUES ('briefing-logos', 'briefing-logos', true);

-- Políticas RLS para briefing-logos
CREATE POLICY "Logos são publicamente acessíveis"
ON storage.objects FOR SELECT
USING (bucket_id = 'briefing-logos');

CREATE POLICY "Usuários autenticados podem fazer upload de logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'briefing-logos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Usuários podem atualizar suas logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'briefing-logos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Usuários podem deletar suas logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'briefing-logos' 
  AND auth.role() = 'authenticated'
);