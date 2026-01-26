import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Zap, MessageSquare, Clock, CheckCircle2, Shield, TrendingUp, Sparkles, Menu,
  Users, Ticket, Link2, Gift, BarChart3, Workflow, Brain, Video, UserPlus, DollarSign, Loader2
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { FAQSection } from "@/components/FAQSection";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useLanguage } from "@/contexts/LanguageContext";
import { CookieNotice } from "@/components/CookieNotice";
import { SocialLinks } from "@/components/SocialLinks";
import { useTheme } from "next-themes";
import { CountdownTimer } from "@/components/CountdownTimer";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { VideoCover } from "@/components/VideoCover";
import outAppLogo from "@/assets/out-app-logo.png";
import heroIcon from "@/assets/hero-icon.png";
import logoLion from "@/assets/logo-lion.png";

interface Plan {
  id: string;
  name: string;
  price: number;
  description: string | null;
  features: any;
  plan_type: string;
  duration_days: number;
  countdown_enabled?: boolean;
  countdown_ends_at?: string;
  limited_offer_banner?: string;
  is_visible?: boolean;
}

interface CustomPage {
  id: string;
  title: string;
  content: string;
  slug: string;
}

const Index = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const { settings: siteSettingsFromHook, isLoading: siteSettingsLoading } = useSiteSettings();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [customPages, setCustomPages] = useState<CustomPage[]>([]);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [selectedPage, setSelectedPage] = useState<CustomPage | null>(null);
  const [pageDialogOpen, setPageDialogOpen] = useState(false);
  const [features, setFeatures] = useState<any[]>([]);
  const [siteTitle, setSiteTitle] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoLightUrl, setLogoLightUrl] = useState("");
  const [logoDarkUrl, setLogoDarkUrl] = useState("");
  const [footerText, setFooterText] = useState("");
  const [footerMenus, setFooterMenus] = useState<any[]>([]);
  const [footerImages, setFooterImages] = useState<string[]>([]);
  const [socialLinks, setSocialLinks] = useState<any[]>([]);
  const [headCode, setHeadCode] = useState("");
  const [footerCode, setFooterCode] = useState("");
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [landingSettings, setLandingSettings] = useState({
    landing_title: "A Solução Tudo em Um<br />para Empreendedores Digitais.",
    hero_title: "Plataforma Completa de Automação<br />e Marketing Digital com IA",
    hero_subtitle: "Construtor visual de automações, CRM, sistema de afiliados, pixels de conversão, agentes IA e muito mais. Tudo em uma plataforma. Teste grátis por 3 dias.",
    hero_cta_text: "Começar Teste Grátis",
    video_section_title: "Veja a Plataforma em Ação",
    video_section_subtitle: "Descubra como é fácil automatizar seu negócio com nossa plataforma completa",
    features_title: "Tudo que Você Precisa em Uma Plataforma",
    features_subtitle: "Automação, IA, CRM, Afiliados, Analytics e muito mais para fazer seu negócio crescer",
    pricing_title: "Planos para Todos os Tamanhos",
    pricing_subtitle: "Comece com 3 dias grátis e escolha o melhor plano para seu negócio crescer",
    cta_title: "Pronto para Transformar seu Negócio?",
    cta_subtitle: "Junte-se a centenas de empresas que já automatizam com nossa plataforma",
    cta_button_text: "Começar Agora - 3 Dias Grátis"
  });

  // Sync from shared hook when loaded
  useEffect(() => {
    if (!siteSettingsLoading && siteSettingsFromHook) {
      setSiteTitle(siteSettingsFromHook.siteTitle);
      setLogoUrl(siteSettingsFromHook.siteLogoUrl);
      setLogoLightUrl(siteSettingsFromHook.siteLogoLightUrl);
      setLogoDarkUrl(siteSettingsFromHook.siteLogoDarkUrl);
      setFooterText(siteSettingsFromHook.footerText);
      setFooterMenus(siteSettingsFromHook.footerMenus);
      setSocialLinks(siteSettingsFromHook.socialLinks);
    }
  }, [siteSettingsLoading, siteSettingsFromHook]);

  useEffect(() => {
    const loadInitialData = async () => {
      await Promise.all([
        fetchPlans(),
        fetchCustomPages(),
        fetchVideoUrl(),
        fetchLandingSettings(),
        fetchFeatures(),
        fetchSiteSettings()
      ]);
      setInitialLoadComplete(true);
    };
    loadInitialData();
  }, []);

  useEffect(() => {
    updatePageTitle();
  }, [siteTitle]);

  // Realtime subscription para atualizar configurações do site
  useEffect(() => {
    const channel = supabase
      .channel('site_settings_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'site_settings',
          filter: 'key=in.(site_title,site_logo_url,site_logo_light_url,site_logo_dark_url)'
        },
        () => {
          fetchSiteSettings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Realtime subscription for plans updates
  useEffect(() => {
    const plansChannel = supabase
      .channel('plans_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'plans' },
        () => {
          fetchPlans();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(plansChannel);
    };
  }, []);

  const fetchPlans = async () => {
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .eq('is_active', true)
      .eq('is_visible', true)
      .order('order_index', { ascending: true });
    
    if (!error && data) {
      setPlans(data);
    }
  };

  const fetchCustomPages = async () => {
    const { data, error } = await supabase
      .from('custom_pages')
      .select('id, title, content, slug, show_in_menu, is_active, order_index')
      .eq('is_active', true)
      .eq('show_in_menu', true)
      .order('order_index', { ascending: true });
    
    if (!error && data) {
      setCustomPages(data);
    }
  };

  const fetchVideoUrl = async () => {
    const { data, error } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'landing_video_url')
      .maybeSingle();
    
    if (!error && data) {
      setVideoUrl(data.value || "");
    }
  };

  const fetchLandingSettings = async () => {
    const keys = Object.keys(landingSettings);
    const { data, error } = await supabase
      .from('site_settings')
      .select('key, value')
      .in('key', keys);

    if (!error && data) {
      const newSettings = { ...landingSettings };
      data.forEach(item => {
        if (item.key in newSettings) {
          newSettings[item.key as keyof typeof landingSettings] = item.value || newSettings[item.key as keyof typeof landingSettings];
        }
      });
      setLandingSettings(newSettings);
    }
  };

  const fetchFeatures = async () => {
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'landing_features')
      .maybeSingle();

    if (data?.value) {
      try {
        const parsedFeatures = JSON.parse(data.value);
        setFeatures(parsedFeatures);
      } catch (e) {
        console.error('Error parsing features:', e);
        // Fallback to default features if parsing fails
        setFeatures(getDefaultFeatures());
      }
    } else {
      setFeatures(getDefaultFeatures());
    }
  };

  const fetchSiteSettings = async () => {
    const keys = ['site_title', 'site_logo_url', 'site_logo_light_url', 'site_logo_dark_url', 'footer_text', 'footer_menus', 'footer_images', 'social_links', 'head_code', 'footer_code'];
    const { data } = await supabase
      .from('site_settings')
      .select('key, value')
      .in('key', keys);

    if (data) {
      data.forEach(item => {
        switch(item.key) {
          case 'site_title':
            setSiteTitle(item.value || "Automação & Marketing");
            break;
          case 'site_logo_url':
            setLogoUrl(item.value || "");
            break;
          case 'site_logo_light_url':
            setLogoLightUrl(item.value || "");
            break;
          case 'site_logo_dark_url':
            setLogoDarkUrl(item.value || "");
            break;
          case 'footer_text':
            setFooterText(item.value || "");
            break;
          case 'footer_menus':
            try {
              setFooterMenus(JSON.parse(item.value || '[]'));
            } catch (e) {}
            break;
          case 'footer_images':
            try {
              setFooterImages(JSON.parse(item.value || '[]'));
            } catch (e) {}
            break;
          case 'social_links':
            try {
              setSocialLinks(JSON.parse(item.value || '[]'));
            } catch (e) {}
            break;
          case 'head_code':
            setHeadCode(item.value || "");
            break;
          case 'footer_code':
            setFooterCode(item.value || "");
            break;
        }
      });
    }
  };

  const updatePageTitle = () => {
    if (siteTitle) {
      document.title = siteTitle;
    }
  };

  const getDefaultFeatures = () => [
    {
      icon: "Workflow",
      title: "Construtor Visual de Automações",
      description: "Construtor drag-and-drop estilo Manychat para criar fluxos de conversação sem código",
    },
    {
      icon: "Brain",
      title: "Agentes IA Personalizados",
      description: "Crie agentes de IA treinados com seus dados e personalidade da sua marca",
    },
    {
      icon: "Users",
      title: "CRM de Contatos Integrado",
      description: "Gerencie leads, contatos e interações em um só lugar com tags e status",
    },
    {
      icon: "UserPlus",
      title: "Sistema de Afiliados Completo",
      description: "Crie programas de afiliados, rastreie cliques, conversões e gerencie comissões",
    },
    {
      icon: "BarChart3",
      title: "Pixels de Conversão",
      description: "Integre Meta Pixel, Google Analytics e outros pixels para rastrear conversões",
    },
    {
      icon: "Link2",
      title: "Gerador de Links WhatsApp",
      description: "Crie links personalizados do WhatsApp com mensagens pré-definidas",
    },
    {
      icon: "Gift",
      title: "Sistema de Vouchers",
      description: "Crie e gerencie cupons de desconto e vouchers de acesso aos planos",
    },
    {
      icon: "Ticket",
      title: "Sistema de Tickets",
      description: "Suporte organizado com sistema de tickets, prioridades e categorias",
    },
    {
      icon: "Video",
      title: "Biblioteca de Tutoriais",
      description: "Vídeos tutoriais organizados por categoria para seus usuários",
    },
    {
      icon: "DollarSign",
      title: "Integrações de Pagamento",
      description: "Conecte Stripe, PagSeguro e outros gateways de pagamento facilmente",
    },
    {
      icon: "Shield",
      title: "Páginas Personalizadas",
      description: "Crie páginas customizadas para termos, políticas e conteúdo institucional",
    },
    {
      icon: "TrendingUp",
      title: "Dashboard de Analytics",
      description: "Acompanhe métricas, conversões, receitas e crescimento em tempo real",
    },
  ];

  const openPageDialog = (page: CustomPage) => {
    setSelectedPage(page);
    setPageDialogOpen(true);
  };

  const getIconComponent = (iconName: string) => {
    const iconMap: Record<string, any> = {
      Workflow, Brain, Users, UserPlus, BarChart3, Link2,
      Gift, Ticket, Video, DollarSign, Shield, TrendingUp,
      Zap, MessageSquare, Clock, CheckCircle2, Sparkles
    };
    const IconComponent = iconMap[iconName] || Sparkles;
    return IconComponent;
  };

  const headerPages = customPages;

  const OffCanvasMenu = ({ headerPages, onPageClick }: { headerPages: CustomPage[], onPageClick: (page: CustomPage) => void }) => (
    <Sheet>
      <SheetTrigger asChild>
        <button className="group relative inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 dark:bg-primary/10 hover:bg-primary/20 border border-primary/50 dark:border-primary/30 hover:border-primary/70 dark:hover:border-primary/50 transition-all duration-300 shadow-[0_0_15px_rgba(12,16,27,0.5)] dark:shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)] hover:shadow-[0_0_25px_rgba(12,16,27,0.7)] dark:hover:shadow-[0_0_25px_rgba(var(--primary-rgb),0.5)]">
          <Menu className="w-5 h-5 text-primary dark:text-primary" />
          <span className="text-sm font-bold text-primary dark:text-primary">Menu</span>
          <div className="absolute inset-0 rounded-xl bg-primary/10 dark:bg-primary/5 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] sm:w-[350px] lg:w-[400px] p-0 flex flex-col bg-gradient-to-b from-background via-background to-background/95 border-l border-primary/20">
        {/* Header com Logo */}
        <SheetHeader className="px-6 py-8 border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse" />
              <img src={logoLion} alt="Logo" className="h-20 w-auto object-contain relative z-10" />
            </div>
            <SheetTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              {t('menu')}
            </SheetTitle>
          </div>
        </SheetHeader>
        
        {/* Menu Items */}
        <ScrollArea className="flex-1">
          <nav className="flex flex-col gap-1 p-4">
            <a 
              href="#" 
              className="group flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-all duration-200"
            >
              <div className="w-2 h-2 rounded-full bg-primary/40 group-hover:bg-primary group-hover:shadow-[0_0_8px_rgba(var(--primary-rgb),0.6)] transition-all duration-200" />
              <span className="font-medium">{t('home')}</span>
            </a>
            <a 
              href="#recursos" 
              className="group flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-all duration-200"
            >
              <div className="w-2 h-2 rounded-full bg-primary/40 group-hover:bg-primary group-hover:shadow-[0_0_8px_rgba(var(--primary-rgb),0.6)] transition-all duration-200" />
              <span className="font-medium">{t('features')}</span>
            </a>
            <a 
              href="#planos" 
              className="group flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-all duration-200"
            >
              <div className="w-2 h-2 rounded-full bg-primary/40 group-hover:bg-primary group-hover:shadow-[0_0_8px_rgba(var(--primary-rgb),0.6)] transition-all duration-200" />
              <span className="font-medium">{t('pricing')}</span>
            </a>
            <a 
              href="/blog" 
              className="group flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-all duration-200"
            >
              <div className="w-2 h-2 rounded-full bg-primary/40 group-hover:bg-primary group-hover:shadow-[0_0_8px_rgba(var(--primary-rgb),0.6)] transition-all duration-200" />
              <span className="font-medium">Blog</span>
            </a>
            <a 
              href="#faq" 
              className="group flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-all duration-200"
            >
              <div className="w-2 h-2 rounded-full bg-primary/40 group-hover:bg-primary group-hover:shadow-[0_0_8px_rgba(var(--primary-rgb),0.6)] transition-all duration-200" />
              <span className="font-medium">{t('faq')}</span>
            </a>
            {headerPages.map((page) => (
              <Link
                key={page.id}
                to={`/${page.slug}`}
                className="group flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-all duration-200"
              >
                <div className="w-2 h-2 rounded-full bg-primary/40 group-hover:bg-primary group-hover:shadow-[0_0_8px_rgba(var(--primary-rgb),0.6)] transition-all duration-200" />
                <span className="font-medium">{page.title}</span>
              </Link>
            ))}
          </nav>
        </ScrollArea>
        
        {/* Footer */}
        <div className="p-5 border-t border-border/50 space-y-4 bg-muted/30">
          <div className="flex justify-center">
            <SocialLinks links={socialLinks} horizontal />
          </div>
          
          <div className="flex flex-col gap-2">
            <Button 
              variant="outline" 
              onClick={() => navigate("/auth")} 
              className="w-full h-11 rounded-xl font-medium border-primary/30 hover:border-primary/50 hover:bg-primary/5"
            >
              {t('login')}
            </Button>
            <Button 
              onClick={() => navigate("/auth")} 
              className="gradient-primary shadow-glow w-full h-11 rounded-xl font-medium"
            >
              {t('start_free')}
            </Button>
          </div>
          
          <div className="flex items-center justify-center gap-3 pt-2">
            <ThemeToggle />
            <LanguageSelector />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );

  // Inject custom head and footer codes
  useEffect(() => {
    const injectedElements: HTMLElement[] = [];
    
    // Inject head code
    if (headCode) {
      const headDiv = document.createElement('div');
      headDiv.innerHTML = headCode;
      const scripts = headDiv.querySelectorAll('script');
      const styles = headDiv.querySelectorAll('style, link');
      const metas = headDiv.querySelectorAll('meta');
      
      // Inject meta tags
      metas.forEach(meta => {
        const newMeta = meta.cloneNode(true) as HTMLElement;
        document.head.appendChild(newMeta);
        injectedElements.push(newMeta);
      });
      
      // Inject styles
      styles.forEach(style => {
        const newStyle = style.cloneNode(true) as HTMLElement;
        document.head.appendChild(newStyle);
        injectedElements.push(newStyle);
      });
      
      // Inject scripts with proper execution
      scripts.forEach(script => {
        const newScript = document.createElement('script');
        
        // Copy all attributes
        Array.from(script.attributes).forEach(attr => {
          newScript.setAttribute(attr.name, attr.value);
        });
        
        if (script.src) {
          newScript.src = script.src;
        } else {
          newScript.textContent = script.textContent;
        }
        
        document.head.appendChild(newScript);
        injectedElements.push(newScript);
      });
    }

    // Inject footer code
    if (footerCode) {
      const footerDiv = document.createElement('div');
      footerDiv.innerHTML = footerCode;
      const elements = footerDiv.children;
      
      Array.from(elements).forEach(element => {
        if (element.tagName === 'SCRIPT') {
          const script = element as HTMLScriptElement;
          const newScript = document.createElement('script');
          
          // Copy all attributes
          Array.from(script.attributes).forEach(attr => {
            newScript.setAttribute(attr.name, attr.value);
          });
          
          if (script.src) {
            newScript.src = script.src;
          } else {
            newScript.textContent = script.textContent;
          }
          
          document.body.appendChild(newScript);
          injectedElements.push(newScript);
        } else {
          const newElement = element.cloneNode(true) as HTMLElement;
          document.body.appendChild(newElement);
          injectedElements.push(newElement);
        }
      });
    }

    // Cleanup function to remove injected elements
    return () => {
      injectedElements.forEach(element => {
        element.remove();
      });
    };
  }, [headCode, footerCode]);

  // Show loading screen while initial data is loading
  if (siteSettingsLoading || !initialLoadComplete) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background safe-area-inset">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-3 xs:px-4 sm:px-6 md:px-8 lg:px-10 py-2 xs:py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-3">
              {(logoLightUrl || logoDarkUrl) ? (
                <img 
                  src={theme === 'dark' ? (logoDarkUrl || logoUrl) : (logoLightUrl || logoUrl)} 
                  alt={siteTitle || "Logo"} 
                  className="h-6 xs:h-7 sm:h-8 md:h-10 lg:h-12 3xl:h-14 w-auto object-contain"
                />
              ) : logoUrl ? (
                <img 
                  src={logoUrl} 
                  alt={siteTitle || "Logo"} 
                  className="h-6 xs:h-7 sm:h-8 md:h-10 lg:h-12 3xl:h-14 w-auto object-contain"
                />
              ) : (
                <img src={outAppLogo} alt="Out App" className="h-6 xs:h-7 sm:h-8 md:h-10 lg:h-12 3xl:h-14 w-auto" />
              )}
              {siteTitle && (
                <span className="text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl 3xl:text-3xl font-bold whitespace-nowrap">
                  {siteTitle}
                </span>
              )}
            </div>
            
            {/* Controls together */}
            <div className="flex items-center gap-2 sm:gap-3">
              <ThemeToggle />
              <LanguageSelector />
              {/* Off-canvas Menu - All screen sizes */}
              <OffCanvasMenu headerPages={headerPages} onPageClick={openPageDialog} />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-16 xs:pt-20 sm:pt-24 md:pt-28 lg:pt-32 3xl:pt-40 pb-10 xs:pb-12 sm:pb-16 md:pb-20 lg:pb-24 3xl:pb-32 px-3 xs:px-4 sm:px-6 md:px-8 lg:px-10 gradient-primary relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-32 xs:w-40 sm:w-48 md:w-64 lg:w-80 3xl:w-96 h-32 xs:h-40 sm:h-48 md:h-64 lg:h-80 3xl:h-96 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-40 xs:w-56 sm:w-64 md:w-80 lg:w-96 3xl:w-[500px] h-40 xs:h-56 sm:h-64 md:h-80 lg:h-96 3xl:h-[500px] bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        
        <div className="container mx-auto text-center text-white relative z-10 max-w-5xl 3xl:max-w-7xl">
          <div className="inline-block mb-4 xs:mb-5 sm:mb-6 md:mb-8 lg:mb-10">
            <img src={heroIcon} alt="Out App" className="w-16 h-16 xs:w-20 xs:h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 3xl:w-52 3xl:h-52" />
          </div>
          
          <h1 
            className="text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl 3xl:text-8xl font-bold mb-4 xs:mb-5 sm:mb-6 md:mb-8 animate-fade-in leading-tight px-2 xs:px-4 sm:px-8 md:px-12 lg:px-16"
            dangerouslySetInnerHTML={{ __html: landingSettings.landing_title }}
          />
          
          <p className="text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl 3xl:text-3xl mb-5 xs:mb-6 sm:mb-8 md:mb-10 text-white/90 max-w-3xl 3xl:max-w-5xl mx-auto animate-fade-in leading-relaxed px-2">
            {landingSettings.hero_subtitle}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 xs:gap-4 sm:gap-5 justify-center animate-scale-in max-w-md sm:max-w-none mx-auto px-2">
            <Button 
              size="lg" 
              onClick={() => navigate("/auth")}
              className="w-full sm:w-auto bg-white text-primary hover:bg-white/90 shadow-glow text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl 3xl:text-3xl px-5 xs:px-6 sm:px-8 md:px-10 py-4 xs:py-5 sm:py-6 md:py-7 lg:py-8 active:scale-95 transition-transform font-semibold"
            >
              {landingSettings.hero_cta_text}
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="w-full sm:w-auto bg-transparent border-white text-white hover:bg-white hover:text-primary text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl 3xl:text-3xl px-5 xs:px-6 sm:px-8 md:px-10 py-4 xs:py-5 sm:py-6 md:py-7 lg:py-8 active:scale-95 transition-all font-semibold"
              onClick={() => document.getElementById('recursos')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Ver Recursos
            </Button>
          </div>
          
          <div className="mt-5 xs:mt-6 sm:mt-8 md:mt-10 lg:mt-12 flex flex-col sm:flex-row items-center justify-center gap-3 xs:gap-4 sm:gap-6 md:gap-8 text-xs xs:text-sm sm:text-base lg:text-lg 3xl:text-xl px-2">
            <div className="flex items-center gap-1.5 xs:gap-2">
              <CheckCircle2 className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 flex-shrink-0" />
              <span className="font-medium">3 dias grátis</span>
            </div>
            <div className="flex items-center gap-1.5 xs:gap-2">
              <CheckCircle2 className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 flex-shrink-0" />
              <span className="font-medium">Sem cartão</span>
            </div>
            <div className="flex items-center gap-1.5 xs:gap-2">
              <CheckCircle2 className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 flex-shrink-0" />
              <span className="font-medium">Cancele quando quiser</span>
            </div>
          </div>
        </div>
      </section>

      {/* Video Section */}
      {videoUrl && (
        <section className="py-10 xs:py-12 sm:py-16 md:py-20 lg:py-24 3xl:py-32 px-3 xs:px-4 sm:px-6 md:px-8 bg-muted/30">
          <div className="container mx-auto max-w-full sm:max-w-6xl lg:max-w-7xl 3xl:max-w-[2000px]">
            <div className="text-center mb-6 xs:mb-8 sm:mb-10 md:mb-12 lg:mb-16 px-2">
              <h2 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl 3xl:text-6xl font-bold mb-3 xs:mb-4 sm:mb-5 md:mb-6 leading-tight">
                {landingSettings.video_section_title}
              </h2>
              <p className="text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl 3xl:text-3xl text-muted-foreground max-w-3xl 3xl:max-w-5xl mx-auto leading-relaxed">
                {landingSettings.video_section_subtitle}
              </p>
            </div>
            
            <VideoCover videoUrl={videoUrl} logoUrl={logoUrl || outAppLogo} />
          </div>
        </section>
      )}

      {/* Features Section */}
      <section id="recursos" className="py-10 xs:py-12 sm:py-16 md:py-20 lg:py-24 3xl:py-32 px-3 xs:px-4 sm:px-6 md:px-8 bg-background">
        <div className="container mx-auto max-w-full sm:max-w-7xl 3xl:max-w-[2000px]">
          <div className="text-center mb-8 xs:mb-10 sm:mb-12 md:mb-16 lg:mb-20 px-2">
            <h2 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 3xl:text-7xl font-bold mb-3 xs:mb-4 sm:mb-5 md:mb-6 leading-tight">
              {landingSettings.features_title}
            </h2>
            <p className="text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl 3xl:text-3xl text-muted-foreground max-w-3xl 3xl:max-w-5xl mx-auto leading-relaxed">
              {landingSettings.features_subtitle}
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-4 gap-4 xs:gap-5 sm:gap-6 md:gap-7 lg:gap-8 max-w-5xl lg:max-w-7xl 3xl:max-w-[2200px] mx-auto">
            {features.map((feature, index) => {
              const Icon = getIconComponent(feature.icon);
              return (
                <div
                  key={feature.id || index}
                  className="bg-card p-4 xs:p-5 sm:p-6 md:p-7 lg:p-8 xl:p-10 3xl:p-12 rounded-xl sm:rounded-2xl border border-border hover:shadow-xl transition-smooth hover-scale"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="bg-primary/10 w-10 h-10 xs:w-12 xs:h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-18 lg:h-18 3xl:w-20 3xl:h-20 rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center mb-3 xs:mb-4 sm:mb-5 md:mb-6 lg:mb-7">
                    <Icon className="w-5 h-5 xs:w-6 xs:h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-9 lg:h-9 3xl:w-10 3xl:h-10 text-primary" />
                  </div>
                  <h3 className="text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl 3xl:text-3xl font-bold mb-2 xs:mb-3 sm:mb-4 leading-tight">{feature.title}</h3>
                  <p className="text-xs xs:text-sm sm:text-base md:text-lg 3xl:text-xl text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="planos" className="py-10 xs:py-12 sm:py-16 md:py-20 lg:py-24 3xl:py-32 px-3 xs:px-4 sm:px-6 md:px-8 bg-muted/30">
        <div className="container mx-auto max-w-full sm:max-w-7xl 3xl:max-w-[2000px]">
          <div className="text-center mb-8 xs:mb-10 sm:mb-12 md:mb-16 lg:mb-20 px-2">
            <h2 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 3xl:text-7xl font-bold mb-3 xs:mb-4 sm:mb-5 md:mb-6 leading-tight">
              {landingSettings.pricing_title}
            </h2>
            <p className="text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl 3xl:text-3xl text-muted-foreground max-w-3xl 3xl:max-w-5xl mx-auto leading-relaxed">
              {landingSettings.pricing_subtitle}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-4 gap-4 xs:gap-5 sm:gap-6 md:gap-7 lg:gap-8 xl:gap-10 max-w-5xl lg:max-w-7xl 3xl:max-w-[2200px] mx-auto">
            {plans.map((plan) => {
              const isPopular = plan.plan_type === 'monthly' && plan.price > 50 && plan.price < 150;
              const features = Array.isArray(plan.features) ? plan.features : [];
const isOfferActive = plan.countdown_enabled && plan.countdown_ends_at && new Date(plan.countdown_ends_at) > new Date();
              
              return (
                <div
                  key={plan.id}
                  className={`bg-card p-4 xs:p-5 sm:p-6 md:p-7 lg:p-8 xl:p-10 3xl:p-12 rounded-xl sm:rounded-2xl border-2 transition-smooth hover-scale ${
                    isPopular 
                      ? 'border-primary shadow-glow relative' 
                      : 'border-border'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-2.5 xs:-top-3 left-1/2 -translate-x-1/2 bg-primary text-white px-3 xs:px-4 py-1 xs:py-1.5 rounded-full text-xs xs:text-sm font-semibold">
                      Mais Popular
                    </div>
                  )}
                  
                  {isOfferActive && (
                    <div className="mb-3 xs:mb-4 sm:mb-5 p-2 xs:p-3 sm:p-4 bg-destructive/10 border border-destructive/20 rounded-lg sm:rounded-xl text-center">
                      {plan.limited_offer_banner && (
                        <p className="text-xs xs:text-sm sm:text-base font-semibold text-destructive mb-1 xs:mb-2">
                          {plan.limited_offer_banner}
                        </p>
                      )}
                      <CountdownTimer 
                        endDate={plan.countdown_ends_at!} 
                        className="text-destructive"
                        onExpire={() => {
                          setPlans(prev => prev.map(p => 
                            p.id === plan.id 
                              ? { ...p, countdown_enabled: false } 
                              : p
                          ));
                        }}
                      />
                    </div>
                  )}
                  
                  <div className="mb-4 xs:mb-5 sm:mb-6 lg:mb-7">
                    <h3 className="text-base xs:text-lg sm:text-xl md:text-2xl lg:text-3xl 3xl:text-4xl font-bold mb-2 xs:mb-3">{plan.name}</h3>
                    <p className="text-muted-foreground text-xs xs:text-sm sm:text-base lg:text-lg">{plan.description}</p>
                  </div>
                  
                  <div className="mb-4 xs:mb-5 sm:mb-6 md:mb-8 lg:mb-10">
                    <span className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl 3xl:text-7xl font-bold">
                      {plan.price === 0 ? 'Grátis' : `R$ ${plan.price}`}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground">
                        /{plan.plan_type === 'monthly' ? 'mês' : plan.plan_type === 'annual' ? 'ano' : plan.plan_type === 'lifetime' ? 'vitalício' : plan.duration_days + ' dias'}
                      </span>
                    )}
                  </div>
                  
                  <ul className="space-y-2 xs:space-y-3 sm:space-y-4">
                    {features.map((feature: string, featureIndex: number) => (
                      <li key={featureIndex} className="flex items-start gap-2 xs:gap-3">
                        <CheckCircle2 className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-xs xs:text-sm sm:text-base lg:text-lg">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
          
          <div className="text-center mt-6 xs:mt-8 sm:mt-10 md:mt-12 lg:mt-16 px-2">
            <p className="text-xs xs:text-sm sm:text-base md:text-lg text-muted-foreground mb-3 xs:mb-4 sm:mb-5 leading-relaxed">
              Teste todas as funcionalidades por 3 dias sem compromisso. Sem cartão de crédito.
            </p>
            <Button 
              size="lg"
              onClick={() => navigate("/auth")}
              className="gradient-primary shadow-glow text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl px-5 xs:px-6 sm:px-8 md:px-10 lg:px-14 py-4 xs:py-5 sm:py-6 md:py-7 lg:py-8 active:scale-95 transition-transform w-full sm:w-auto max-w-md font-semibold"
            >
              Começar Teste Grátis - 3 Dias
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <FAQSection hideSupportCTA />

      {/* CTA Section */}
      <section className="py-8 xs:py-10 sm:py-12 md:py-16 lg:py-20 3xl:py-28 px-3 xs:px-4 sm:px-6 md:px-8 gradient-primary relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 right-10 w-32 xs:w-40 sm:w-48 md:w-64 lg:w-80 h-32 xs:h-40 sm:h-48 md:h-64 lg:h-80 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 left-10 w-40 xs:w-56 sm:w-64 md:w-80 lg:w-96 h-40 xs:h-56 sm:h-64 md:h-80 lg:h-96 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        
        <div className="container mx-auto text-center text-white relative z-10 max-w-4xl 3xl:max-w-6xl">
          <h2 className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl 3xl:text-6xl font-bold mb-2 xs:mb-3 sm:mb-4 md:mb-6">
            {landingSettings.cta_title}
          </h2>
          <p className="text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl 3xl:text-2xl mb-4 xs:mb-5 sm:mb-6 md:mb-8 text-white/90 max-w-2xl 3xl:max-w-4xl mx-auto">
            {landingSettings.cta_subtitle}
          </p>
          <Button 
            size="lg"
            onClick={() => navigate("/auth")}
            className="w-full sm:w-auto max-w-md bg-white text-primary hover:bg-white/90 shadow-glow text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl px-4 xs:px-5 sm:px-6 md:px-8 py-3 xs:py-4 sm:py-5 md:py-6 active:scale-95 transition-transform"
          >
            {landingSettings.cta_button_text}
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/50 border-t">
        <div className="container mx-auto px-3 xs:px-4 sm:px-6 md:px-8 py-8 xs:py-10 sm:py-12 lg:py-16 3xl:py-20">
          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 xs:gap-8 mb-6 xs:mb-8">
            <div className="space-y-3 xs:space-y-4 xs:col-span-2 md:col-span-1">
              {logoUrl ? (
                <img src={logoUrl} alt={siteTitle} className="h-8 xs:h-10 sm:h-12 lg:h-14 w-auto mb-3 xs:mb-4" />
              ) : (
                <div className="flex items-center gap-2 mb-3 xs:mb-4">
                  <img src={outAppLogo} alt="Out App" className="h-6 xs:h-7 sm:h-8 w-auto" />
                  <span className="font-bold text-base xs:text-lg sm:text-xl lg:text-2xl">{siteTitle || "Out App"}</span>
                </div>
              )}
              <SocialLinks links={socialLinks} variant="footer" />
            </div>
            
            {footerMenus.map((menu: any, index: number) => (
              <div key={index}>
                <h4 className="font-semibold mb-2 xs:mb-3 sm:mb-4 text-sm xs:text-base sm:text-lg">{menu.title}</h4>
                <ul className="space-y-1.5 xs:space-y-2">
                  {menu.links?.map((link: any, linkIndex: number) => (
                    <li key={linkIndex}>
                      <a 
                        href={link.url} 
                        className="text-xs xs:text-sm sm:text-base text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {footerImages.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-4 xs:gap-6 sm:gap-8 py-4 xs:py-5 sm:py-6 border-t">
              {footerImages.map((img, index) => (
                <img 
                  key={index} 
                  src={img} 
                  alt={`Partner ${index + 1}`}
                  className="h-8 xs:h-10 sm:h-12 w-auto opacity-70 hover:opacity-100 transition-opacity"
                />
              ))}
            </div>
          )}

          <div className="pt-6 xs:pt-8 border-t text-center space-y-3">
            <p className="text-xs xs:text-sm sm:text-base text-muted-foreground">
              {footerText || `© ${new Date().getFullYear()} ${siteTitle || 'Out App'}. Todos os direitos reservados.`}
            </p>
            <p className="text-xs text-muted-foreground">
              Um Negócio do Grupo Liberdade Financeira Online - 21.233.977/0001-29
            </p>
            <a 
              href="https://klicsmart.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>Criado com carinho pela agência</span>
              <img 
                src="/klic-smart-logo.png" 
                alt="Klic Smart AI" 
                className="h-5 w-5 object-contain"
              />
              <span className="font-medium">Klic Smart</span>
            </a>
          </div>
        </div>
      </footer>

      {/* Page Dialog */}
      <Dialog open={pageDialogOpen} onOpenChange={setPageDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto mx-2 xs:mx-4">
          <DialogHeader>
            <DialogTitle className="text-lg xs:text-xl sm:text-2xl">{selectedPage?.title}</DialogTitle>
          </DialogHeader>
          <div className="mt-4 xs:mt-6 text-sm xs:text-base leading-relaxed whitespace-pre-wrap">
            {selectedPage?.content}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;