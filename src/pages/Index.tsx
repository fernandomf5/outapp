import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Bot, Zap, MessageSquare, Clock, CheckCircle2, Shield, TrendingUp, Sparkles, Menu,
  Users, Ticket, Link2, Gift, BarChart3, Workflow, Brain, Video, UserPlus, DollarSign
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
  const [landingSettings, setLandingSettings] = useState({
    landing_title: "A Solução Tudo em Um<br />para Empreendedores Digitais.",
    hero_title: "Plataforma Completa de Automação<br />e Marketing Digital com IA",
    hero_subtitle: "Construtor visual de automações, CRM, sistema de afiliados, pixels de conversão, agentes IA e muito mais. Tudo em uma plataforma. Teste grátis por 3 dias.",
    hero_cta_text: "Começar Teste Grátis 🚀",
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

  useEffect(() => {
    fetchPlans();
    fetchCustomPages();
    fetchVideoUrl();
    fetchLandingSettings();
    fetchFeatures();
    fetchSiteSettings();
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
      Bot, Zap, MessageSquare, Clock, CheckCircle2, Sparkles
    };
    const IconComponent = iconMap[iconName] || Sparkles;
    return IconComponent;
  };

  const headerPages = customPages;

  const MobileMenu = ({ headerPages, onPageClick }: { headerPages: CustomPage[], onPageClick: (page: CustomPage) => void }) => (
    <Sheet>
      <SheetTrigger asChild className="lg:hidden">
        <Button variant="ghost" size="sm" className="px-2">
          <Menu className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[280px] sm:w-[320px] p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b border-border">
          <SheetTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            {t('menu')}
          </SheetTitle>
        </SheetHeader>
        <ScrollArea className="flex-1 px-6">
          <nav className="flex flex-col gap-4 py-6">
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-smooth py-2">
              {t('home')}
            </a>
            <a href="#recursos" className="text-sm text-muted-foreground hover:text-foreground transition-smooth py-2">
              {t('features')}
            </a>
            <a href="#planos" className="text-sm text-muted-foreground hover:text-foreground transition-smooth py-2">
              {t('pricing')}
            </a>
            <a href="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-smooth py-2">
              Blog
            </a>
            <a href="#faq" className="text-sm text-muted-foreground hover:text-foreground transition-smooth py-2">
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
              <SocialLinks links={socialLinks} horizontal />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mt-4 pt-4 border-t border-border">
              <Button variant="ghost" onClick={() => navigate("/auth")} className="w-full justify-start">
                {t('login')}
              </Button>
              <Button onClick={() => navigate("/auth")} className="gradient-primary shadow-glow w-full">
                {t('start_free')}
              </Button>
            </div>
            <div className="mt-4 flex gap-2 pb-6">
              <ThemeToggle />
              <LanguageSelector />
            </div>
          </nav>
        </ScrollArea>
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-6 sm:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              {(logoLightUrl || logoDarkUrl) ? (
                <img 
                  src={theme === 'dark' ? (logoDarkUrl || logoUrl) : (logoLightUrl || logoUrl)} 
                  alt={siteTitle || "Logo"} 
                  className="h-8 sm:h-10 w-auto object-contain"
                />
              ) : logoUrl ? (
                <img 
                  src={logoUrl} 
                  alt={siteTitle || "Logo"} 
                  className="h-8 sm:h-10 w-auto object-contain"
                />
              ) : (
                <>
                  <div className="bg-primary/10 p-1.5 sm:p-2 rounded-lg">
                    <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <span className="text-base sm:text-lg md:text-xl font-bold">
                    {siteTitle || "Out App"}
                  </span>
                </>
              )}
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-6">
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-smooth">
                {t('home')}
              </a>
              <a href="#recursos" className="text-sm text-muted-foreground hover:text-foreground transition-smooth">
                {t('features')}
              </a>
              <a href="#planos" className="text-sm text-muted-foreground hover:text-foreground transition-smooth">
                {t('pricing')}
              </a>
              <a href="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-smooth">
                Blog
              </a>
              <a href="#faq" className="text-sm text-muted-foreground hover:text-foreground transition-smooth">
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
            <MobileMenu headerPages={headerPages} onPageClick={openPageDialog} />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 sm:pt-28 md:pt-32 pb-16 sm:pb-20 md:pb-24 px-4 sm:px-6 md:px-8 gradient-primary relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-48 sm:w-64 h-48 sm:h-64 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-64 sm:w-96 h-64 sm:h-96 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        
        <div className="container mx-auto text-center text-white relative z-10 max-w-5xl">
          <div className="inline-block mb-6 sm:mb-8 p-3 sm:p-4 bg-white/10 backdrop-blur-sm rounded-xl">
            <Bot className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20" />
          </div>
          
          <h1 
            className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 sm:mb-8 animate-fade-in leading-tight px-8 sm:px-12 md:px-16"
            dangerouslySetInnerHTML={{ __html: landingSettings.landing_title }}
          />
          
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-8 sm:mb-10 text-white/90 max-w-3xl mx-auto animate-fade-in leading-relaxed px-2">
            {landingSettings.hero_subtitle}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 justify-center animate-scale-in max-w-md sm:max-w-none mx-auto px-2">
            <Button 
              size="lg" 
              onClick={() => navigate("/auth")}
              className="w-full sm:w-auto bg-white text-primary hover:bg-white/90 shadow-glow text-base sm:text-lg md:text-xl px-8 sm:px-10 py-6 sm:py-7 active:scale-95 transition-transform font-semibold"
            >
              {landingSettings.hero_cta_text}
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="w-full sm:w-auto bg-green-400/20 border-white text-white hover:bg-green-400/30 text-base sm:text-lg md:text-xl px-8 sm:px-10 py-6 sm:py-7 active:scale-95 transition-transform font-semibold"
              onClick={() => document.getElementById('recursos')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Ver Recursos
            </Button>
          </div>
          
          <div className="mt-8 sm:mt-10 md:mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 md:gap-8 text-sm sm:text-base px-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
              <span className="font-medium">3 dias grátis</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
              <span className="font-medium">Sem cartão</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
              <span className="font-medium">Cancele quando quiser</span>
            </div>
          </div>
        </div>
      </section>

      {/* Video Section */}
      {videoUrl && (
        <section className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 md:px-8 bg-muted/30">
          <div className="container mx-auto max-w-full sm:max-w-6xl lg:max-w-7xl">
            <div className="text-center mb-10 sm:mb-12 md:mb-16 px-2">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-5 md:mb-6 leading-tight">
                {landingSettings.video_section_title}
              </h2>
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                {landingSettings.video_section_subtitle}
              </p>
            </div>
            
            <div className="relative w-full aspect-video rounded-xl sm:rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl bg-muted">
              <iframe
                src={videoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                title="Video demonstração"
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section id="recursos" className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 md:px-8 bg-background">
        <div className="container mx-auto max-w-full sm:max-w-7xl">
          <div className="text-center mb-12 sm:mb-16 md:mb-20 px-2">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-5 md:mb-6 leading-tight">
              {landingSettings.features_title}
            </h2>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              {landingSettings.features_subtitle}
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-7 md:gap-8 max-w-5xl lg:max-w-7xl mx-auto">
            {features.map((feature, index) => {
              const Icon = getIconComponent(feature.icon);
              return (
                <div
                  key={feature.id || index}
                  className="bg-card p-7 sm:p-8 md:p-10 rounded-2xl border border-border hover:shadow-xl transition-smooth hover-scale"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="bg-primary/10 w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 rounded-xl md:rounded-2xl flex items-center justify-center mb-5 sm:mb-6 md:mb-7">
                    <Icon className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 text-primary" />
                  </div>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4 leading-tight">{feature.title}</h3>
                  <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="planos" className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 md:px-8 bg-muted/30">
        <div className="container mx-auto max-w-full sm:max-w-7xl">
          <div className="text-center mb-12 sm:mb-16 md:mb-20 px-2">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-5 md:mb-6 leading-tight">
              {landingSettings.pricing_title}
            </h2>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              {landingSettings.pricing_subtitle}
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-7 md:gap-8 lg:gap-10 max-w-5xl lg:max-w-7xl mx-auto">
            {plans.map((plan) => {
              const isPopular = plan.plan_type === 'monthly' && plan.price > 50 && plan.price < 150;
              const features = Array.isArray(plan.features) ? plan.features : [];
const isOfferActive = plan.countdown_enabled && plan.countdown_ends_at && new Date(plan.countdown_ends_at) > new Date();
              
              return (
                <div
                  key={plan.id}
                  className={`bg-card p-7 sm:p-8 md:p-10 rounded-2xl border-2 transition-smooth hover-scale ${
                    isPopular 
                      ? 'border-primary shadow-glow relative' 
                      : 'border-border'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white px-4 py-1.5 rounded-full text-sm font-semibold">
                      Mais Popular
                    </div>
                  )}
                  
                  {isOfferActive && (
                    <div className="mb-5 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-center">
                      {plan.limited_offer_banner && (
                        <p className="text-base font-semibold text-destructive mb-2">
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
                  
                  <div className="mb-6 sm:mb-7">
                    <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3">{plan.name}</h3>
                    <p className="text-muted-foreground text-sm sm:text-base">{plan.description}</p>
                  </div>
                  
                  <div className="mb-6 sm:mb-8 md:mb-10">
                    <span className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold">
                      {plan.price === 0 ? 'Grátis' : `R$ ${plan.price}`}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-sm sm:text-base md:text-lg text-muted-foreground">
                        /{plan.plan_type === 'monthly' ? 'mês' : plan.plan_type === 'annual' ? 'ano' : plan.plan_type === 'lifetime' ? 'vitalício' : plan.duration_days + ' dias'}
                      </span>
                    )}
                  </div>
                  
                  <ul className="space-y-3 sm:space-y-4">
                    {features.map((feature: string, featureIndex: number) => (
                      <li key={featureIndex} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm sm:text-base">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
          
          <div className="text-center mt-10 sm:mt-12 md:mt-16 px-2">
            <p className="text-base sm:text-lg text-muted-foreground mb-5 leading-relaxed">
              Teste todas as funcionalidades por 3 dias sem compromisso. Sem cartão de crédito.
            </p>
            <Button 
              size="lg"
              onClick={() => navigate("/auth")}
              className="gradient-primary shadow-glow text-base sm:text-lg md:text-xl px-8 sm:px-10 md:px-14 py-6 sm:py-7 md:py-8 active:scale-95 transition-transform w-full sm:w-auto max-w-md font-semibold"
            >
              Começar Teste Grátis - 3 Dias 🚀
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <FAQSection hideSupportCTA />

      {/* CTA Section */}
      <section className="py-10 sm:py-16 md:py-20 px-6 sm:px-8 gradient-primary relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 right-10 w-48 sm:w-64 h-48 sm:h-64 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 left-10 w-64 sm:w-96 h-64 sm:h-96 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        
        <div className="container mx-auto text-center text-white relative z-10 max-w-4xl">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4 md:mb-6">
            {landingSettings.cta_title}
          </h2>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl mb-5 sm:mb-6 md:mb-8 text-white/90 max-w-2xl mx-auto">
            {landingSettings.cta_subtitle}
          </p>
          <Button 
            size="lg"
            onClick={() => navigate("/auth")}
            className="w-full sm:w-auto max-w-md bg-white text-primary hover:bg-white/90 shadow-glow text-sm sm:text-base md:text-lg px-6 sm:px-8 py-5 sm:py-6 active:scale-95 transition-transform"
          >
            {landingSettings.cta_button_text}
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/50 border-t">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              {logoUrl ? (
                <img src={logoUrl} alt={siteTitle} className="h-12 w-auto mb-4" />
              ) : (
                <div className="flex items-center gap-2 mb-4">
                  <Bot className="h-8 w-8 text-primary" />
                  <span className="font-bold text-xl">{siteTitle || "Automação"}</span>
                </div>
              )}
              {footerText && (
                <p className="text-sm text-muted-foreground">{footerText}</p>
              )}
              <SocialLinks links={socialLinks} variant="footer" />
            </div>
            
            {footerMenus.map((menu: any, index: number) => (
              <div key={index}>
                <h4 className="font-semibold mb-4">{menu.title}</h4>
                <ul className="space-y-2">
                  {menu.links?.map((link: any, linkIndex: number) => (
                    <li key={linkIndex}>
                      <a 
                        href={link.url} 
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
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
            <div className="flex items-center justify-center gap-8 py-6 border-t">
              {footerImages.map((img, index) => (
                <img 
                  key={index} 
                  src={img} 
                  alt={`Partner ${index + 1}`}
                  className="h-12 w-auto opacity-70 hover:opacity-100 transition-opacity"
                />
              ))}
            </div>
          )}

          <div className="pt-8 border-t text-center">
            <p className="text-sm text-muted-foreground">
              {footerText || `© ${new Date().getFullYear()} ${siteTitle || 'Automação'}. Todos os direitos reservados.`}
            </p>
          </div>
        </div>
      </footer>

      {/* Page Dialog */}
      <Dialog open={pageDialogOpen} onOpenChange={setPageDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{selectedPage?.title}</DialogTitle>
          </DialogHeader>
          <div className="mt-6 text-base leading-relaxed whitespace-pre-wrap">
            {selectedPage?.content}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;