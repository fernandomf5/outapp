-- Adicionar política para permitir leitura pública de produtos ativos
CREATE POLICY "Anyone can view active products" 
ON public.products 
FOR SELECT 
USING (is_active = true);

-- Adicionar política para permitir leitura pública de serviços ativos
CREATE POLICY "Anyone can view active user_services" 
ON public.user_services 
FOR SELECT 
USING (is_active = true);