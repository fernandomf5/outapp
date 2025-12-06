-- Adicionar coluna is_expired_trial na tabela vouchers
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS is_expired_trial boolean DEFAULT false;