-- Adicionar policies de admin para upload de assets do site no bucket avatars
-- Usando a tabela user_roles e função has_role

-- Permitir que admins façam upload de qualquer arquivo no bucket avatars
CREATE POLICY "Admins can upload site assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Permitir que admins atualizem site assets
CREATE POLICY "Admins can update site assets"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Permitir que admins deletem site assets
CREATE POLICY "Admins can delete site assets"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND has_role(auth.uid(), 'admin'::app_role)
);