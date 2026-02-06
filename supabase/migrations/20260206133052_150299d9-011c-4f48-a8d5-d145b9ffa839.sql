-- Adicionar política para permitir leitura pública de categorias ativas
-- Isso é necessário para que o catálogo público exiba os itens agrupados por categoria
CREATE POLICY "Anyone can view active product_categories" 
ON public.product_categories 
FOR SELECT 
USING (is_active = true);