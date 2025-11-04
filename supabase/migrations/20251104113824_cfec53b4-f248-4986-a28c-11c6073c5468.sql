-- Criar tabela para respostas de briefings
CREATE TABLE IF NOT EXISTS public.briefing_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  briefing_id UUID NOT NULL,
  visitor_name TEXT,
  visitor_email TEXT,
  visitor_phone TEXT,
  visitor_company TEXT,
  responses JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.briefing_responses ENABLE ROW LEVEL SECURITY;

-- Política para inserir respostas (público)
CREATE POLICY "Anyone can submit briefing responses"
ON public.briefing_responses
FOR INSERT
WITH CHECK (true);

-- Política para ver respostas (apenas dono do briefing)
CREATE POLICY "Users can view responses to their briefings"
ON public.briefing_responses
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.briefings
    WHERE briefings.id = briefing_responses.briefing_id
    AND briefings.user_id = auth.uid()
  )
);

-- Criar tabela para configuração global de APIs de anúncios (admin)
CREATE TABLE IF NOT EXISTS public.ad_spy_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meta_access_token TEXT,
  google_api_key TEXT,
  tiktok_api_key TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ad_spy_config ENABLE ROW LEVEL SECURITY;

-- Política para admins gerenciarem config
CREATE POLICY "Only admins can manage ad spy config"
ON public.ad_spy_config
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Inserir config padrão vazia
INSERT INTO public.ad_spy_config (meta_access_token, google_api_key, tiktok_api_key)
VALUES ('', '', '')
ON CONFLICT DO NOTHING;

-- Trigger para updated_at
CREATE TRIGGER update_ad_spy_config_updated_at
BEFORE UPDATE ON public.ad_spy_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();