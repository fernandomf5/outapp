-- Create affiliate program table
CREATE TABLE public.affiliate_programs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  commission_percentage NUMERIC(5,2) NOT NULL DEFAULT 10.00,
  cookie_duration_days INTEGER NOT NULL DEFAULT 30,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create affiliates table
CREATE TABLE public.affiliates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID NOT NULL REFERENCES public.affiliate_programs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  affiliate_code TEXT NOT NULL UNIQUE,
  custom_domain TEXT,
  total_clicks INTEGER NOT NULL DEFAULT 0,
  total_conversions INTEGER NOT NULL DEFAULT 0,
  total_commission NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(program_id, user_id)
);

-- Create affiliate clicks table
CREATE TABLE public.affiliate_clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  visitor_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create affiliate conversions table
CREATE TABLE public.affiliate_conversions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  order_id TEXT,
  amount NUMERIC(10,2) NOT NULL,
  commission_amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cloned pages table
CREATE TABLE public.cloned_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  original_url TEXT NOT NULL,
  cloned_url TEXT NOT NULL,
  page_content TEXT,
  custom_settings JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.affiliate_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cloned_pages ENABLE ROW LEVEL SECURITY;

-- Policies for affiliate_programs
CREATE POLICY "Users can view their own programs"
ON public.affiliate_programs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own programs"
ON public.affiliate_programs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own programs"
ON public.affiliate_programs FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own programs"
ON public.affiliate_programs FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all programs"
ON public.affiliate_programs FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Policies for affiliates
CREATE POLICY "Users can view their own affiliate accounts"
ON public.affiliates FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own affiliate accounts"
ON public.affiliates FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Program owners can view their affiliates"
ON public.affiliates FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.affiliate_programs
  WHERE affiliate_programs.id = affiliates.program_id
  AND affiliate_programs.user_id = auth.uid()
));

CREATE POLICY "Admins can view all affiliates"
ON public.affiliates FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Policies for affiliate_clicks
CREATE POLICY "Affiliates can view their own clicks"
ON public.affiliate_clicks FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.affiliates
  WHERE affiliates.id = affiliate_clicks.affiliate_id
  AND affiliates.user_id = auth.uid()
));

CREATE POLICY "Program owners can view clicks from their affiliates"
ON public.affiliate_clicks FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.affiliates
  JOIN public.affiliate_programs ON affiliate_programs.id = affiliates.program_id
  WHERE affiliates.id = affiliate_clicks.affiliate_id
  AND affiliate_programs.user_id = auth.uid()
));

-- Policies for affiliate_conversions
CREATE POLICY "Affiliates can view their own conversions"
ON public.affiliate_conversions FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.affiliates
  WHERE affiliates.id = affiliate_conversions.affiliate_id
  AND affiliates.user_id = auth.uid()
));

CREATE POLICY "Program owners can manage conversions"
ON public.affiliate_conversions FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.affiliates
  JOIN public.affiliate_programs ON affiliate_programs.id = affiliates.program_id
  WHERE affiliates.id = affiliate_conversions.affiliate_id
  AND affiliate_programs.user_id = auth.uid()
));

-- Policies for cloned_pages
CREATE POLICY "Affiliates can manage their own cloned pages"
ON public.cloned_pages FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.affiliates
  WHERE affiliates.id = cloned_pages.affiliate_id
  AND affiliates.user_id = auth.uid()
));

-- Triggers
CREATE TRIGGER update_affiliate_programs_updated_at
BEFORE UPDATE ON public.affiliate_programs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_affiliates_updated_at
BEFORE UPDATE ON public.affiliates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_affiliate_conversions_updated_at
BEFORE UPDATE ON public.affiliate_conversions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cloned_pages_updated_at
BEFORE UPDATE ON public.cloned_pages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_affiliate_programs_user_id ON public.affiliate_programs(user_id);
CREATE INDEX idx_affiliates_program_id ON public.affiliates(program_id);
CREATE INDEX idx_affiliates_user_id ON public.affiliates(user_id);
CREATE INDEX idx_affiliates_code ON public.affiliates(affiliate_code);
CREATE INDEX idx_affiliate_clicks_affiliate_id ON public.affiliate_clicks(affiliate_id);
CREATE INDEX idx_affiliate_conversions_affiliate_id ON public.affiliate_conversions(affiliate_id);
CREATE INDEX idx_cloned_pages_affiliate_id ON public.cloned_pages(affiliate_id);