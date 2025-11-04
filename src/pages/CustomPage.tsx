import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { LanguageSelector } from "@/components/LanguageSelector";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useTheme } from "next-themes";
import { Helmet } from "react-helmet-async";

interface CustomPage {
  id: string;
  title: string;
  content: string;
  slug: string;
}

interface CustomMenuItem {
  id: string;
  title: string;
  slug: string;
  location: string;
  is_active: boolean;
}

const CustomPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [page, setPage] = useState<CustomPage | null>(null);
  const [menuItems, setMenuItems] = useState<CustomMenuItem[]>([]);
  const [logoUrl, setLogoUrl] = useState("");
  const [logoLightUrl, setLogoLightUrl] = useState("");
  const [logoDarkUrl, setLogoDarkUrl] = useState("");
  const [siteTitle, setSiteTitle] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchPage();
      fetchMenuItems();
      fetchSiteSettings();
    }
  }, [slug]);

  const fetchPage = async () => {
    const { data, error } = await supabase
      .from('custom_pages')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      navigate('/404');
      return;
    }

    setPage(data);
  };

  const fetchMenuItems = async () => {
    const { data } = await supabase
      .from('custom_pages')
      .select('id, title, slug, location, is_active')
      .eq('is_active', true)
      .eq('location', 'header')
      .order('order_index', { ascending: true });

    if (data) {
      setMenuItems(data);
    }
  };

  const fetchSiteSettings = async () => {
    const { data } = await supabase
      .from('site_settings')
      .select('key, value')
      .in('key', ['site_logo_url', 'site_logo_light_url', 'site_logo_dark_url', 'site_title']);

    if (data) {
      data.forEach(setting => {
        if (setting.key === 'site_logo_url') setLogoUrl(setting.value);
        if (setting.key === 'site_logo_light_url') setLogoLightUrl(setting.value);
        if (setting.key === 'site_logo_dark_url') setLogoDarkUrl(setting.value);
        if (setting.key === 'site_title') setSiteTitle(setting.value);
      });
    }
  };

  const getCurrentLogo = () => {
    if (theme === 'light' && logoLightUrl) return logoLightUrl;
    if (theme === 'dark' && logoDarkUrl) return logoDarkUrl;
    return logoUrl || '/logo.png';
  };

  if (!page) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>{page.title} | {siteTitle || 'Site'}</title>
        <meta name="description" content={(page.content || '').replace(/\s+/g,' ').slice(0, 155)} />
        <link rel="canonical" href={`${window.location.origin}/custom/${page.slug}`} />
      </Helmet>
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <img 
                src={getCurrentLogo()} 
                alt={siteTitle}
                className="h-8 w-auto object-contain"
              />
            </Link>

            {/* Desktop Menu */}
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/" className="text-sm font-medium hover:text-primary transition-colors">
                Início
              </Link>
              {menuItems.map((item) => (
                <Link
                  key={item.id}
                  to={`/custom/${item.slug}`}
                  className="text-sm font-medium hover:text-primary transition-colors"
                >
                  {item.title}
                </Link>
              ))}
              <ThemeToggle />
              <LanguageSelector />
            </nav>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden items-center gap-2">
              <ThemeToggle />
              <LanguageSelector />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <nav className="md:hidden py-4 space-y-2 border-t">
              <Link
                to="/"
                className="block px-4 py-2 text-sm font-medium hover:bg-muted rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                Início
              </Link>
              {menuItems.map((item) => (
                <Link
                  key={item.id}
                  to={`/custom/${item.slug}`}
                  className="block px-4 py-2 text-sm font-medium hover:bg-muted rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.title}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-12">
        <article className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">{page.title}</h1>
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <p className="whitespace-pre-wrap">{page.content}</p>
          </div>
        </article>
      </main>
    </div>
  );
};

export default CustomPage;
