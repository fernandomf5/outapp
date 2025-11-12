-- Criar bucket para imagens do blog
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-images', 'blog-images', true);

-- Criar políticas de acesso ao bucket blog-images
CREATE POLICY "Blog images são publicamente acessíveis"
ON storage.objects FOR SELECT
USING (bucket_id = 'blog-images');

CREATE POLICY "Admins podem fazer upload de imagens do blog"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'blog-images' 
  AND auth.uid() IN (
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  )
);

CREATE POLICY "Admins podem atualizar imagens do blog"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'blog-images' 
  AND auth.uid() IN (
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  )
);

CREATE POLICY "Admins podem deletar imagens do blog"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'blog-images' 
  AND auth.uid() IN (
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  )
);