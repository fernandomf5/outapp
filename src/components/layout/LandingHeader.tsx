import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Bot, Menu } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { LanguageSelector } from "@/components/LanguageSelector";
import { SocialLinks } from "@/components/SocialLinks";
import { useTheme } from "next-themes";
import { useLanguage } from "@/contexts/LanguageContext";

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
    if (theme === 'dark' && (logoDarkUrl || logoUrl)) return logoDarkUrl || logoUrl;
    if (theme === 'light' && (logoLightUrl || logoUrl)) return logoLightUrl || logoUrl;
    return logoUrl;
  };

  const MobileMenu = ({ headerPages }: { headerPages: CustomPageItem[] }) => (
    <Sheet>
      <SheetTrigger asChild className="lg:hidden">
        <Button variant="ghost" size="sm" className="px-2">
          <Menu className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[280px] sm:w-[320px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            {t('menu')}
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-4 mt-8">
          <a href="/" className="text-sm text-muted-foreground hover:text-foreground transition-smooth py-2">
            {t('home')}
          </a>
          <a href="/#recursos" className="text-sm text-muted-foreground hover:text-foreground transition-smooth py-2">
            {t('features')}
          </a>
          <a href="/#planos" className="text-sm text-muted-foreground hover:text-foreground transition-smooth py-2">
            {t('pricing')}
          </a>
          <a href="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-smooth py-2">
            Blog
          </a>
          <a href="/#faq" className="text-sm text-muted-foreground hover:text-foreground transition-smooth py-2">
            {t('faq')}
          </a>
           {headerPages.map((page) => (
            <Link
              key={page.id}
              to={`/${page.slug}`}
              className="text-sm text-muted-foreground hover:text-foreground transition-smooth py-2"
            >
              {page.title}
            </Link>
          ))}
          <div className="mt-4 pt-4 border-t border-border">
            <SocialLinks links={socialLinks} vertical />
          </div>
          <div className="flex flex-col sm:flex-row gap-2 mt-4 pt-4 border-t border-border">
            <Button variant="ghost" onClick={() => navigate("/auth")} className="w-full justify-start">
              {t('login')}
            </Button>
            <Button onClick={() => navigate("/auth")} className="gradient-primary shadow-glow w-full">
              {t('start_free')}
            </Button>
          </div>
          <div className="mt-4 flex gap-2">
            <ThemeToggle />
            <LanguageSelector />
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-6 sm:px-8 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 cursor-pointer">
            {currentLogo() ? (
              <img 
                src={currentLogo()} 
                alt={siteTitle || "Logo"} 
                className="h-8 sm:h-10 w-auto object-contain"
              />
            ) : (
              <>
                <div className="bg-primary/10 p-1.5 sm:p-2 rounded-lg">
                  <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>
                <span className="text-base sm:text-lg md:text-xl font-bold">
                  {siteTitle || "Bot Reals Zapp"}
                </span>
              </>
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
          {/* Mobile/Tablet Navigation */}
          <MobileMenu headerPages={headerPages} />
        </div>
      </div>
    </header>
  );
};
