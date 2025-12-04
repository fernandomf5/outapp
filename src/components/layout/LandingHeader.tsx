import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Menu, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { LanguageSelector } from "@/components/LanguageSelector";
import { SocialLinks } from "@/components/SocialLinks";
import { useTheme } from "next-themes";
import { useLanguage } from "@/contexts/LanguageContext";
import logoLion from "@/assets/logo-lion.png";

interface CustomPageItem {
  id: string;
  title: string;
  slug: string;
  is_active: boolean;
  show_in_menu: boolean;
}

export const LandingHeader = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const [headerPages, setHeaderPages] = useState<CustomPageItem[]>([]);
  const [siteTitle, setSiteTitle] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoLightUrl, setLogoLightUrl] = useState("");
  const [logoDarkUrl, setLogoDarkUrl] = useState("");
  const [socialLinks, setSocialLinks] = useState<any[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [pagesRes, settingsRes] = await Promise.all([
        supabase
          .from('custom_pages')
          .select('id, title, slug, is_active, show_in_menu')
          .eq('is_active', true)
          .eq('show_in_menu', true)
          .order('order_index', { ascending: true }),
        supabase
          .from('site_settings')
          .select('key, value')
          .in('key', ['site_title', 'site_logo_url', 'site_logo_light_url', 'site_logo_dark_url', 'social_links'])
      ]);

      if (pagesRes.data) setHeaderPages(pagesRes.data as CustomPageItem[]);
      if (settingsRes.data) {
        settingsRes.data.forEach(item => {
          switch(item.key) {
            case 'site_title':
              setSiteTitle(item.value || 'Site');
              break;
            case 'site_logo_url':
              setLogoUrl(item.value || '');
              break;
            case 'site_logo_light_url':
              setLogoLightUrl(item.value || '');
              break;
            case 'site_logo_dark_url':
              setLogoDarkUrl(item.value || '');
              break;
            case 'social_links':
              try { setSocialLinks(JSON.parse(item.value || '[]')); } catch {}
              break;
          }
        });
      }
    };

    fetchData();
  }, []);

  const currentLogo = () => {
    if (theme === 'dark') {
      return logoDarkUrl || logoUrl || logoLightUrl || null;
    }
    if (theme === 'light') {
      return logoLightUrl || logoUrl || logoDarkUrl || null;
    }
    return logoUrl || logoDarkUrl || logoLightUrl || null;
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-6 sm:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" onClick={(e) => { e.preventDefault(); navigate('/'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-smooth">
              {currentLogo() ? (
                <img 
                  src={currentLogo()} 
                  alt={siteTitle || "Logo"} 
                  className="h-8 sm:h-10 w-auto object-contain"
                />
              ) : (
                <img src={logoLion} alt="Out App" className="h-8 sm:h-10 w-auto" />
              )}
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-6">
              <a href="/" className="text-sm text-muted-foreground hover:text-foreground transition-smooth">
                {t('home')}
              </a>
              <a href="/#recursos" className="text-sm text-muted-foreground hover:text-foreground transition-smooth">
                {t('features')}
              </a>
              <a href="/#planos" className="text-sm text-muted-foreground hover:text-foreground transition-smooth">
                {t('pricing')}
              </a>
              <a href="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-smooth">
                Blog
              </a>
              <a href="/#faq" className="text-sm text-muted-foreground hover:text-foreground transition-smooth">
                {t('faq')}
              </a>
              {headerPages.map((page) => (
                <Link
                  key={page.id}
                  to={`/${page.slug}`}
                  className="text-sm text-muted-foreground hover:text-foreground transition-smooth"
                >
                  {page.title}
                </Link>
              ))}
              <SocialLinks links={socialLinks} />
              <ThemeToggle />
              <LanguageSelector />
              <Button variant="ghost" size="sm" onClick={() => navigate("/auth")} className="active:scale-95 transition-transform">
                {t('login')}
              </Button>
              <Button size="sm" onClick={() => navigate("/auth")} className="gradient-primary shadow-glow active:scale-95 transition-transform">
                {t('start_free')}
              </Button>
            </nav>

            {/* Mobile Menu Button */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="lg:hidden px-2"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Off-Canvas Menu - Criado do Zero */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black/80"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Menu Panel */}
          <div className="absolute right-0 top-0 h-full w-[280px] sm:w-[320px] bg-background flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header com Logo e Botão Fechar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="flex-1" />
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-1"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Logo e Título */}
            <div className="flex flex-col items-center gap-4 px-6 py-6 border-b border-border">
              <img 
                src={logoLion} 
                alt="Logo" 
                className="h-24 w-auto object-contain"
              />
              <span className="text-xl font-bold">{t('menu')}</span>
            </div>

            {/* Menu Items */}
            <ScrollArea className="flex-1 px-6">
              <nav className="flex flex-col gap-4 py-6">
                <a 
                  href="/" 
                  className="text-sm text-muted-foreground hover:text-foreground transition-smooth py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('home')}
                </a>
                <a 
                  href="/#recursos" 
                  className="text-sm text-muted-foreground hover:text-foreground transition-smooth py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('features')}
                </a>
                <a 
                  href="/#planos" 
                  className="text-sm text-muted-foreground hover:text-foreground transition-smooth py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('pricing')}
                </a>
                <a 
                  href="/blog" 
                  className="text-sm text-muted-foreground hover:text-foreground transition-smooth py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Blog
                </a>
                <a 
                  href="/#faq" 
                  className="text-sm text-muted-foreground hover:text-foreground transition-smooth py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('faq')}
                </a>
                {headerPages.map((page) => (
                  <Link
                    key={page.id}
                    to={`/${page.slug}`}
                    className="text-sm text-muted-foreground hover:text-foreground transition-smooth py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {page.title}
                  </Link>
                ))}
                
                <div className="mt-4 pt-4 border-t border-border">
                  <SocialLinks links={socialLinks} horizontal />
                </div>
                
                <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-border">
                  <Button 
                    variant="ghost" 
                    onClick={() => { navigate("/auth"); setMobileMenuOpen(false); }} 
                    className="w-full justify-start"
                  >
                    {t('login')}
                  </Button>
                  <Button 
                    onClick={() => { navigate("/auth"); setMobileMenuOpen(false); }} 
                    className="gradient-primary shadow-glow w-full"
                  >
                    {t('start_free')}
                  </Button>
                </div>
                
                <div className="mt-4 flex gap-2 pb-6">
                  <ThemeToggle />
                  <LanguageSelector />
                </div>
              </nav>
            </ScrollArea>
          </div>
        </div>
      )}
    </>
  );
};