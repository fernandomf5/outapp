-- Tabela de progresso de aulas (para Curso Online)
CREATE TABLE IF NOT EXISTS members_course_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  members_area_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  module_id UUID NOT NULL,
  completed BOOLEAN DEFAULT false,
  progress_percentage INTEGER DEFAULT 0,
  last_watched_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(members_area_id, user_email, module_id)
);

-- Tabela de certificados (para Curso Online)
CREATE TABLE IF NOT EXISTS members_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  members_area_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  certificate_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de posts da comunidade (para Comunidade Privada)
CREATE TABLE IF NOT EXISTS members_community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  members_area_id UUID NOT NULL,
  author_email TEXT NOT NULL,
  author_name TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de comentários (para Comunidade Privada)
CREATE TABLE IF NOT EXISTS members_community_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES members_community_posts(id) ON DELETE CASCADE,
  author_email TEXT NOT NULL,
  author_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de likes (para Comunidade Privada)
CREATE TABLE IF NOT EXISTS members_community_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES members_community_posts(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(post_id, user_email)
);

-- Tabela de tickets de suporte (para Portal de Clientes)
CREATE TABLE IF NOT EXISTS members_support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  members_area_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de mensagens dos tickets
CREATE TABLE IF NOT EXISTS members_ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES members_support_tickets(id) ON DELETE CASCADE,
  sender_email TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  message TEXT NOT NULL,
  is_staff BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de documentos do cliente (para Portal de Clientes)
CREATE TABLE IF NOT EXISTS members_client_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  members_area_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  uploaded_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de downloads de produtos digitais
CREATE TABLE IF NOT EXISTS members_digital_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  members_area_id UUID NOT NULL,
  product_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  version TEXT DEFAULT '1.0',
  download_count INTEGER DEFAULT 0,
  last_downloaded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de licenças (para Produtos Digitais)
CREATE TABLE IF NOT EXISTS members_product_licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  members_area_id UUID NOT NULL,
  product_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  license_key TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE members_course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE members_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE members_community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE members_community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE members_community_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE members_support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE members_ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE members_client_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE members_digital_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE members_product_licenses ENABLE ROW LEVEL SECURITY;

-- RLS Policies (permitir acesso público por enquanto - você pode ajustar depois)
CREATE POLICY "Allow all operations on course_progress" ON members_course_progress FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on certificates" ON members_certificates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on community_posts" ON members_community_posts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on community_comments" ON members_community_comments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on community_likes" ON members_community_likes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on support_tickets" ON members_support_tickets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on ticket_messages" ON members_ticket_messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on client_documents" ON members_client_documents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on digital_downloads" ON members_digital_downloads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on product_licenses" ON members_product_licenses FOR ALL USING (true) WITH CHECK (true);

-- Trigger para atualizar contador de comentários
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE members_community_posts 
    SET comments_count = comments_count + 1 
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE members_community_posts 
    SET comments_count = comments_count - 1 
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_comments_count
AFTER INSERT OR DELETE ON members_community_comments
FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();

-- Trigger para atualizar contador de likes
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE members_community_posts 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE members_community_posts 
    SET likes_count = likes_count - 1 
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_likes_count
AFTER INSERT OR DELETE ON members_community_likes
FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();