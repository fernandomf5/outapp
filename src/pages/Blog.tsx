import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Calendar, User, Eye, Tag, Search } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Helmet } from "react-helmet-async";
import { linkifyText } from "@/utils/linkify";
import lionLogo from "@/assets/logo-lion.png";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  author_name: string;
  featured_image_url: string | null;
  category: string | null;
  tags: string[];
  published_at: string | null;
  views_count: number;
}

interface BlogSettings {
  site_name: string;
  site_description: string;
  logo_url: string | null;
  banner_top_url: string | null;
  banner_top_link: string | null;
  header_menu: { label: string; url: string }[];
  footer_content: string | null;
  footer_menu: { label: string; url: string }[];
  social_links: { platform: string; url: string }[];
}

export default function Blog() {
  const { slug } = useParams<{ slug?: string }>();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [settings, setSettings] = useState<BlogSettings | null>(null);

  useEffect(() => {
    loadBlogSettings();
    if (slug) {
      fetchPost(slug);
    } else {
      setSelectedPost(null);
      fetchPosts();
    }
  }, [slug]);

  const loadBlogSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_settings' as any)
        .select('*')
        .single();

      if (!error && data) {
        setSettings(data as any);
      }
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
    }
  };

  const fetchPosts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('is_published', true)
      .order('published_at', { ascending: false });

    if (!error && data) {
      setPosts(data);
    }
    setLoading(false);
  };

  const fetchPost = async (postSlug: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', postSlug)
      .eq('is_published', true)
      .maybeSingle();

    if (!error && data) {
      setSelectedPost(data);
      
      // Incrementar views
      await supabase
        .from('blog_posts')
        .update({ views_count: data.views_count + 1 })
        .eq('id', data.id);
    }
    setLoading(false);
  };

  const filteredPosts = posts.filter(post => {
    // Filtro de texto
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Filtro de data
    let matchesDate = true;
    if (post.published_at) {
      const postDate = new Date(post.published_at);
      if (startDate) {
        const start = new Date(startDate);
        matchesDate = matchesDate && postDate >= start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Incluir o dia completo
        matchesDate = matchesDate && postDate <= end;
      }
    }
    
    return matchesSearch && matchesDate;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (selectedPost) {
    return (
      <div className="min-h-screen bg-background">
        <Helmet>
          <title>{selectedPost.title} | Out App Blog</title>
          <meta name="description" content={selectedPost.excerpt || selectedPost.content.substring(0, 160)} />
        </Helmet>

        {/* Top Banner */}
        {settings?.banner_top_url && (
          <div className="w-full">
            {settings.banner_top_link ? (
              <a href={settings.banner_top_link} target="_blank" rel="noopener noreferrer">
                <img src={settings.banner_top_url} alt="Banner" className="w-full h-auto max-h-32 object-cover" />
              </a>
            ) : (
              <img src={settings.banner_top_url} alt="Banner" className="w-full h-auto max-h-32 object-cover" />
            )}
          </div>
        )}

      {/* Header */}
      <header className="border-b border-primary/20 bg-card shadow-md">
        <div className="container max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src={settings?.logo_url || lionLogo} alt="Logo" className="h-10 w-auto border-2 border-primary/30 rounded-lg p-1" />
              <div>
                <h1 className="text-xl font-bold text-primary">Out App Blog</h1>
                <p className="text-sm text-muted-foreground">{settings?.site_description || 'Notícias, atualizações e novidades'}</p>
              </div>
            </div>
            {settings && settings.header_menu.length > 0 && (
              <nav className="hidden md:flex gap-6">
                {settings.header_menu.map((item, index) => (
                  <a
                    key={index}
                    href={item.url}
                    className="text-sm hover:text-primary transition-colors font-medium border-b-2 border-transparent hover:border-primary pb-1"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            )}
          </div>
        </div>
      </header>

        <div className="container max-w-4xl mx-auto px-4 py-8">
          <Button
            variant="outline"
            onClick={() => navigate('/blog')}
            className="mb-6 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para o Blog
          </Button>

          <article className="space-y-6">
            {selectedPost.featured_image_url && (
              <img
                src={selectedPost.featured_image_url}
                alt={selectedPost.title}
                className="w-full h-64 object-cover rounded-lg"
              />
            )}

            <div>
              <h1 className="text-4xl font-bold mb-4">{selectedPost.title}</h1>
              
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  <span className="font-medium">{selectedPost.author_name}</span>
                </div>
                {selectedPost.published_at && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    {format(new Date(selectedPost.published_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-primary" />
                  {selectedPost.views_count} visualizações
                </div>
                {selectedPost.category && (
                  <Badge className="bg-primary text-primary-foreground">{selectedPost.category}</Badge>
                )}
              </div>

              {selectedPost.tags.length > 0 && (
                <div className="flex items-center gap-2 mb-6">
                  <Tag className="w-4 h-4 text-muted-foreground" />
                  <div className="flex flex-wrap gap-2">
                    {selectedPost.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div 
              className="prose prose-lg dark:prose-invert max-w-none"
              style={{ whiteSpace: 'pre-wrap' }}
            >
              {linkifyText(selectedPost.content)}
            </div>
          </article>
        </div>

        {/* Footer */}
        {settings && (
          <footer className="border-t bg-card mt-12">
            <div className="container max-w-6xl mx-auto px-4 py-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  {settings.footer_content && (
                    <p className="text-sm text-muted-foreground">{settings.footer_content}</p>
                  )}
                  {settings.social_links.length > 0 && (
                    <div className="flex gap-4 mt-4">
                      {settings.social_links.map((link, index) => (
                        <a
                          key={index}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          {link.platform}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
                {settings.footer_menu.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {settings.footer_menu.map((item, index) => (
                      <a
                        key={index}
                        href={item.url}
                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        {item.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </footer>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Out App Blog</title>
        <meta name="description" content={settings?.site_description || 'Notícias, atualizações e novidades'} />
      </Helmet>

      {/* Top Banner */}
      {settings?.banner_top_url && (
        <div className="w-full">
          {settings.banner_top_link ? (
            <a href={settings.banner_top_link} target="_blank" rel="noopener noreferrer">
              <img src={settings.banner_top_url} alt="Banner" className="w-full h-auto max-h-32 object-cover" />
            </a>
          ) : (
            <img src={settings.banner_top_url} alt="Banner" className="w-full h-auto max-h-32 object-cover" />
          )}
        </div>
      )}

      {/* Header */}
      <header className="border-b border-primary/20 bg-card shadow-md">
        <div className="container max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src={settings?.logo_url || lionLogo} alt="Logo" className="h-10 w-auto border-2 border-primary/30 rounded-lg p-1" />
              <div>
                <h1 className="text-xl font-bold text-primary">Out App Blog</h1>
                <p className="text-sm text-muted-foreground">{settings?.site_description || 'Notícias, atualizações e novidades'}</p>
              </div>
            </div>
            {settings && settings.header_menu.length > 0 && (
              <nav className="hidden md:flex gap-6">
                {settings.header_menu.map((item, index) => (
                  <a
                    key={index}
                    href={item.url}
                    className="text-sm hover:text-primary transition-colors font-medium border-b-2 border-transparent hover:border-primary pb-1"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            )}
          </div>
        </div>
      </header>

      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar posts..."
              className="pl-10"
            />
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Data Inicial</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Data Final</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
          
          {(searchQuery || startDate || endDate) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setStartDate("");
                setEndDate("");
              }}
              className="w-full"
            >
              Limpar Filtros
            </Button>
          )}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <Card
              key={post.id}
              className="overflow-hidden hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-primary hover:border-l-primary/80 hover:scale-105"
              onClick={() => navigate(`/blog/${post.slug}`)}
            >
              {post.featured_image_url && (
                <div className="relative">
                  <img
                    src={post.featured_image_url}
                    alt={post.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary/50"></div>
                </div>
              )}
              <div className="p-6 space-y-4">
                {post.category && (
                  <Badge className="bg-primary text-primary-foreground">{post.category}</Badge>
                )}
                <h3 className="text-xl font-bold line-clamp-2 text-foreground hover:text-primary transition-colors">{post.title}</h3>
                <p className="text-muted-foreground line-clamp-3">
                  {post.excerpt || post.content.substring(0, 150)}...
                </p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4 text-primary" />
                    {post.author_name}
                  </div>
                  {post.published_at && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-primary" />
                      {format(new Date(post.published_at), "dd/MM/yyyy")}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredPosts.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            Nenhum post encontrado
          </div>
        )}
      </div>

      {/* Footer */}
      {settings && (
        <footer className="border-t bg-card mt-12">
          <div className="container max-w-6xl mx-auto px-4 py-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                {settings.footer_content && (
                  <p className="text-sm text-muted-foreground">{settings.footer_content}</p>
                )}
                {settings.social_links.length > 0 && (
                  <div className="flex gap-4 mt-4">
                    {settings.social_links.map((link, index) => (
                      <a
                        key={index}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        {link.platform}
                      </a>
                    ))}
                  </div>
                )}
              </div>
              {settings.footer_menu.length > 0 && (
                <div className="flex flex-col gap-2">
                  {settings.footer_menu.map((item, index) => (
                    <a
                      key={index}
                      href={item.url}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {item.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
