-- Criar tabela de blog posts
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  content text NOT NULL,
  excerpt text,
  author_name text NOT NULL DEFAULT 'Admin',
  featured_image_url text,
  category text,
  tags text[] DEFAULT '{}',
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamp with time zone,
  views_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  order_index integer NOT NULL DEFAULT 0
);

-- Adicionar RLS para blog posts
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Admins podem gerenciar posts
CREATE POLICY "Admins can manage blog posts"
  ON public.blog_posts
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Público pode ver posts publicados
CREATE POLICY "Public can view published blog posts"
  ON public.blog_posts
  FOR SELECT
  USING (is_published = true);

-- Adicionar campo blocked em profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS blocked boolean NOT NULL DEFAULT false;

-- Criar tabela de domínios personalizados dos usuários (unificada)
CREATE TABLE IF NOT EXISTS public.user_domains (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domain text NOT NULL,
  is_verified boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(domain)
);

-- RLS para user_domains
ALTER TABLE public.user_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own domains"
  ON public.user_domains
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all domains"
  ON public.user_domains
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON public.blog_posts(is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_domains_user_id ON public.user_domains(user_id);
CREATE INDEX IF NOT EXISTS idx_user_domains_domain ON public.user_domains(domain);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_blog_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_blog_posts_updated_at();