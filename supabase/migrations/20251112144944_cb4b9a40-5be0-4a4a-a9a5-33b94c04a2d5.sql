-- Adicionar coluna product_id para rastrear qual produto o usuário comprou
ALTER TABLE public.members_area_subscriptions
ADD COLUMN IF NOT EXISTS product_id text;

-- Adicionar índice para melhorar performance de consultas
CREATE INDEX IF NOT EXISTS idx_subscriptions_product_id 
ON public.members_area_subscriptions(product_id);

-- Adicionar índice composto para consultas de acesso
CREATE INDEX IF NOT EXISTS idx_subscriptions_area_user 
ON public.members_area_subscriptions(members_area_id, user_email, status);