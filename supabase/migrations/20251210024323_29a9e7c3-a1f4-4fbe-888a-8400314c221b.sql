-- Criar tabela de cupons de desconto
CREATE TABLE public.discount_coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL DEFAULT 'percentage', -- 'percentage' or 'fixed'
  discount_value NUMERIC NOT NULL,
  min_purchase_amount NUMERIC DEFAULT 0,
  max_uses INTEGER, -- NULL = ilimitado
  uses_count INTEGER NOT NULL DEFAULT 0,
  max_uses_per_user INTEGER DEFAULT 1,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE,
  applicable_plans UUID[], -- NULL = todos os planos
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para rastrear uso de cupons por usuário
CREATE TABLE public.coupon_usages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coupon_id UUID NOT NULL REFERENCES public.discount_coupons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  plan_id UUID,
  original_price NUMERIC NOT NULL,
  discounted_price NUMERIC NOT NULL,
  discount_amount NUMERIC NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.discount_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usages ENABLE ROW LEVEL SECURITY;

-- Policies para discount_coupons
CREATE POLICY "Admins can manage discount coupons" ON public.discount_coupons
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active coupons" ON public.discount_coupons
  FOR SELECT USING (is_active = true);

-- Policies para coupon_usages
CREATE POLICY "Admins can view all coupon usages" ON public.coupon_usages
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own coupon usages" ON public.coupon_usages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create coupon usages" ON public.coupon_usages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Índices
CREATE INDEX idx_discount_coupons_code ON public.discount_coupons(code);
CREATE INDEX idx_discount_coupons_active ON public.discount_coupons(is_active);
CREATE INDEX idx_coupon_usages_user ON public.coupon_usages(user_id);
CREATE INDEX idx_coupon_usages_coupon ON public.coupon_usages(coupon_id);