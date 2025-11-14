-- Add cashbox fields to ad_clients table
ALTER TABLE public.ad_clients
ADD COLUMN IF NOT EXISTS general_cashbox DECIMAL(12,2) DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS ads_cashbox DECIMAL(12,2) DEFAULT 0 NOT NULL;

-- Add comment to columns
COMMENT ON COLUMN public.ad_clients.general_cashbox IS 'Caixa disponível geral do cliente';
COMMENT ON COLUMN public.ad_clients.ads_cashbox IS 'Caixa disponível para anúncios do cliente';