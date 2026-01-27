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
import { useSiteSettings } from "@/hooks/useSiteSettings";
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
  const { settings, isLoading } = useSiteSettings();
  const [headerPages, setHeaderPages] = useState<CustomPageItem[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchPages = async () => {
      const { data } = await supabase
        .from('custom_pages')
        .select('id, title, slug, is_active, show_in_menu')
        .eq('is_active', true)
        .eq('show_in_menu', true)
        .order('order_index', { ascending: true });

      if (data) setHeaderPages(data as CustomPageItem[]);
    };

    fetchPages();
  }, []);

  const currentLogo = () => {
    if (theme === 'dark') {
      return settings.siteLogoDarkUrl || settings.siteLogoUrl || settings.siteLogoLightUrl || null;
    }
    if (theme === 'light') {
      return settings.siteLogoLightUrl || settings.siteLogoUrl || settings.siteLogoDarkUrl || null;
    }
    return settings.siteLogoUrl || settings.siteLogoDarkUrl || settings.siteLogoLightUrl || null;
  };

  // Show nothing until settings are loaded to prevent flash
  if (isLoading) {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-6 sm:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="h-8 sm:h-10 w-24 bg-muted/50 animate-pulse rounded" />
            <div className="hidden lg:flex items-center gap-6">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="h-4 w-16 bg-muted/50 animate-pulse rounded" />
              ))}
            </div>
            <div className="lg:hidden h-8 w-8 bg-muted/50 animate-pulse rounded" />
          </div>
        </div>
      </header>
    );
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-6 sm:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" onClick={(e) => { e.preventDefault(); navigate('/'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-smooth">
              {currentLogo() ? (
                <img 
                  src={currentLogo()!} 
                  alt={settings.siteTitle || "Logo"} 
                  className="h-8 sm:h-10 w-auto object-contain"
                />
              ) : (
                <img src={logoLion} alt="Out App" className="h-8 sm:h-10 w-auto" />
              )}
            </Link>

            {/* Right Side Controls */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Desktop Only - Social Links */}
              <div className="hidden lg:block">
                <SocialLinks links={settings.socialLinks} />
              </div>
              
              <ThemeToggle />
              <LanguageSelector />
              
              {/* Desktop Only - Login Buttons next to Menu */}
              <div className="hidden lg:flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => navigate("/auth")} className="active:scale-95 transition-transform">
                  {t('login')}
                </Button>
                <Button size="sm" onClick={() => navigate("/auth")} className="gradient-primary shadow-glow active:scale-95 transition-transform">
                  {t('start_free')}
                </Button>
              </div>
              
              {/* Menu Button - All Screens */}
              <button 
                onClick={() => setMobileMenuOpen(true)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent transition-colors border border-border"
              >
                <Menu className="w-5 h-5" />
                <span className="text-sm font-semibold whitespace-nowrap">Menu</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Off-Canvas Menu - All Screens */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100]">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Menu Panel */}
          <div className="absolute right-0 top-0 h-full w-[300px] sm:w-[340px] bg-gradient-to-b from-background to-background/95 flex flex-col animate-in slide-in-from-right duration-300 shadow-2xl">
            {/* Header com Botão Fechar */}
            <div className="flex items-center justify-end px-6 py-5 border-b border-border/50">
              <Button 
                variant="ghost" 
                size="icon"
                className="h-9 w-9 rounded-full hover:bg-destructive/10 hover:text-destructive transition-all"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Logo */}
            <div className="flex justify-center py-8 border-b border-border/50">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
                <img 
                  src={currentLogo() || logoLion} 
                  alt="Logo" 
                  className="h-20 w-auto object-contain relative z-10"
                />
              </div>
            </div>

            {/* Menu Items */}
            <ScrollArea className="flex-1">
              <nav className="flex flex-col gap-1 p-4">
                <a 
                  href="/" 
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-all group"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="w-2 h-2 rounded-full bg-primary/50 group-hover:bg-primary transition-colors" />
                  <span className="font-medium">{t('home')}</span>
                </a>
                <a 
                  href="/#recursos" 
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-all group"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="w-2 h-2 rounded-full bg-primary/50 group-hover:bg-primary transition-colors" />
                  <span className="font-medium">{t('features')}</span>
                </a>
                <a 
                  href="/#planos" 
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-all group"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="w-2 h-2 rounded-full bg-primary/50 group-hover:bg-primary transition-colors" />
                  <span className="font-medium">{t('pricing')}</span>
                </a>
                <a 
                  href="/blog" 
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-all group"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="w-2 h-2 rounded-full bg-primary/50 group-hover:bg-primary transition-colors" />
                  <span className="font-medium">Blog</span>
                </a>
                <a 
                  href="/#faq" 
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-all group"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="w-2 h-2 rounded-full bg-primary/50 group-hover:bg-primary transition-colors" />
                  <span className="font-medium">{t('faq')}</span>
                </a>
                {headerPages.map((page) => (
                  <Link
                    key={page.id}
                    to={`/${page.slug}`}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-all group"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="w-2 h-2 rounded-full bg-primary/50 group-hover:bg-primary transition-colors" />
                    <span className="font-medium">{page.title}</span>
                  </Link>
                ))}
              </nav>
            </ScrollArea>

            {/* Footer Section */}
            <div className="p-4 border-t border-border/50 space-y-4 bg-muted/30">
              {/* Social Links */}
              <div className="flex justify-center">
                <SocialLinks links={settings.socialLinks} horizontal />
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => { navigate("/auth"); setMobileMenuOpen(false); }} 
                  className="w-full h-11 rounded-xl font-medium"
                >
                  {t('login')}
                </Button>
                <Button 
                  onClick={() => { navigate("/auth"); setMobileMenuOpen(false); }} 
                  className="gradient-primary shadow-glow w-full h-11 rounded-xl font-medium"
                >
                  {t('start_free')}
                </Button>
              </div>
              
              {/* Theme & Language */}
              <div className="flex items-center justify-center gap-3 pt-2">
                <ThemeToggle />
                <LanguageSelector />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
