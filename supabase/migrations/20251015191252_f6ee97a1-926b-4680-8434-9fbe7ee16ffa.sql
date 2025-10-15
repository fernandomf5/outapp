-- Remover a policy que depende da coluna affiliate_id
DROP POLICY IF EXISTS "Affiliates can manage their own cloned pages" ON public.cloned_pages CASCADE;

-- Remover a coluna affiliate_id e adicionar user_id
ALTER TABLE public.cloned_pages 
  DROP COLUMN IF EXISTS affiliate_id CASCADE,
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Criar novas policies para usuários gerenciarem suas páginas
CREATE POLICY "Users can manage their own cloned pages"
  ON public.cloned_pages
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);