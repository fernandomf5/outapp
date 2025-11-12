-- Atualizar tipo do campo promotional_banners para incluir description
-- Como é JSONB, não é necessário alterar a estrutura da coluna
-- Os novos dados com description serão salvos automaticamente

-- Adicionar comentário para documentar a estrutura esperada
COMMENT ON COLUMN public.blog_settings.promotional_banners IS 
'Array de banners promocionais em formato stories: [{"image_url": "url", "link": "url", "title": "título", "description": "descrição"}]';