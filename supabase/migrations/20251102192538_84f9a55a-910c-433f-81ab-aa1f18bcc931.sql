-- Criar tabela user_domains se não existir
CREATE TABLE IF NOT EXISTS public.user_domains (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domain TEXT NOT NULL UNIQUE,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_domains ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies for user_domains
DROP POLICY IF EXISTS "Users can view their own domains" ON public.user_domains;
DROP POLICY IF EXISTS "Users can insert their own domains" ON public.user_domains;
DROP POLICY IF EXISTS "Users can update their own domains" ON public.user_domains;
DROP POLICY IF EXISTS "Users can delete their own domains" ON public.user_domains;

CREATE POLICY "Users can view their own domains"
  ON public.user_domains FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own domains"
  ON public.user_domains FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own domains"
  ON public.user_domains FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own domains"
  ON public.user_domains FOR DELETE
  USING (auth.uid() = user_id);

-- Add custom_domain to link_bios if not exists
DO $$ BEGIN
  ALTER TABLE public.link_bios ADD COLUMN IF NOT EXISTS custom_domain TEXT;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_domains_user_id ON public.user_domains(user_id);
CREATE INDEX IF NOT EXISTS idx_user_domains_domain ON public.user_domains(domain);
CREATE INDEX IF NOT EXISTS idx_link_bios_custom_domain ON public.link_bios(custom_domain);