
-- Create commercial_proposals table
CREATE TABLE public.commercial_proposals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  
  -- Company data
  company_name TEXT,
  company_logo_url TEXT,
  company_email TEXT,
  company_phone TEXT,
  company_address TEXT,
  company_cnpj TEXT,
  
  -- Client data
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  client_company TEXT,
  client_cnpj TEXT,
  client_address TEXT,
  
  -- Proposal content
  title TEXT NOT NULL,
  introduction TEXT,
  services JSONB DEFAULT '[]'::jsonb,
  timeline JSONB DEFAULT '[]'::jsonb,
  pricing JSONB DEFAULT '{"items": [], "total": 0, "discount": 0}'::jsonb,
  conditions TEXT,
  
  -- Customization
  primary_color TEXT DEFAULT '#6366f1',
  
  -- Status and tracking
  status TEXT NOT NULL DEFAULT 'draft',
  valid_until DATE,
  sent_at TIMESTAMP WITH TIME ZONE,
  viewed_at TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  
  -- Signature
  client_signature_url TEXT,
  client_accepted_name TEXT,
  client_accepted_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  slug TEXT UNIQUE,
  is_private BOOLEAN DEFAULT false,
  private_token TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.commercial_proposals ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own proposals"
ON public.commercial_proposals
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can view proposals by slug"
ON public.commercial_proposals
FOR SELECT
USING (slug IS NOT NULL AND is_private = false);

CREATE POLICY "Public can view private proposals with token"
ON public.commercial_proposals
FOR SELECT
USING (private_token IS NOT NULL);

CREATE POLICY "Public can update proposal acceptance"
ON public.commercial_proposals
FOR UPDATE
USING (slug IS NOT NULL OR private_token IS NOT NULL)
WITH CHECK (slug IS NOT NULL OR private_token IS NOT NULL);

-- Create index for faster lookups
CREATE INDEX idx_proposals_user_id ON public.commercial_proposals(user_id);
CREATE INDEX idx_proposals_slug ON public.commercial_proposals(slug);
CREATE INDEX idx_proposals_status ON public.commercial_proposals(status);

-- Trigger for updated_at
CREATE TRIGGER update_commercial_proposals_updated_at
BEFORE UPDATE ON public.commercial_proposals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
