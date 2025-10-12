import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Bot, Zap, MessageSquare, Clock, CheckCircle2, Shield, TrendingUp, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface Plan {
  id: string;
  name: string;
  price: number;
  description: string | null;
  features: any;
  plan_type: string;
  duration_days: number;
}

interface CustomPage {
  id: string;
  title: string;
  content: string;
  slug: string;
  location: string;
  open_as_popup: boolean;
}

const Index = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [customPages, setCustomPages] = useState<CustomPage[]>([]);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [selectedPage, setSelectedPage] = useState<CustomPage | null>(null);
  const [pageDialogOpen, setPageDialogOpen] = useState(false);

  useEffect(() => {
    fetchPlans();
    fetchCustomPages();
    fetchVideoUrl();
  }, []);

  const fetchPlans = async () => {
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .eq('is_active', true)
      .order('price', { ascending: true });
    
    if (!error && data) {
      setPlans(data);
    }
  };

  const fetchCustomPages = async () => {
    const { data, error } = await supabase
      .from('custom_pages')
      .select('*')
      .eq('is_active', true)
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

  const openPageDialog = (page: CustomPage) => {
    setSelectedPage(page);
    setPageDialogOpen(true);
  };

  const features = [
    {
      icon: Zap,
      title: "Integração WhatsApp",
      description: "Conecte facilmente via QR Code e comece a automatizar em minutos",
    },
    {
      icon: Bot,
      title: "Chatbots Inteligentes",
      description: "Crie chatbots automatizados com respostas personalizadas para seu WhatsApp",
    },
    {
      icon: Sparkles,
      title: "Agentes IA Avançados",
      description: "IA com contexto e personalidade, treinada especificamente para seu negócio",
    },
    {
      icon: MessageSquare,
      title: "Respostas Automáticas 24/7",
      description: "Atendimento automático que nunca dorme, sempre disponível para seus clientes",
    },
    {
      icon: TrendingUp,
      title: "Aumente suas Vendas",
      description: "Converta mais leads com respostas instantâneas e personalizadas",
    },
    {
      icon: Shield,
      title: "Seguro e Confiável",
      description: "Seus dados protegidos com a melhor tecnologia de segurança",
    },
    {
      icon: Clock,
      title: "Mensagens Agendadas",
      description: "Agende mensagens para serem enviadas no melhor momento",
    },
    {
      icon: MessageSquare,
      title: "Sistema de Notificações",
      description: "Receba notificações instantâneas de mensagens importantes",
    },
  ];

  const headerPages = customPages.filter(p => p.location === 'header');
  const footerPages = customPages.filter(p => p.location === 'footer');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 p-1.5 sm:p-2 rounded-lg">
                <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <span className="text-base sm:text-lg md:text-xl font-bold">Bot Reals Zapp</span>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-6">
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-smooth">
                Início
              </a>
              <a href="#recursos" className="text-sm text-muted-foreground hover:text-foreground transition-smooth">
                Recursos
              </a>
              <a href="#planos" className="text-sm text-muted-foreground hover:text-foreground transition-smooth">
                Planos
              </a>
              {headerPages.map((page) => (
                <button
                  key={page.id}
                  onClick={() => page.open_as_popup && openPageDialog(page)}
                  className="text-sm text-muted-foreground hover:text-foreground transition-smooth"
                >
                  {page.title}
                </button>
              ))}
              <Button variant="ghost" size="sm" onClick={() => navigate("/auth")} className="active:scale-95 transition-transform">
                Entrar
              </Button>
              <Button size="sm" onClick={() => navigate("/auth")} className="gradient-primary shadow-glow active:scale-95 transition-transform">
                Começar Grátis
              </Button>
            </nav>
            
            {/* Mobile Navigation - Simplified */}
            <div className="flex lg:hidden items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate("/auth")}
                className="text-xs px-2 active:scale-95 transition-transform"
              >
                Entrar
              </Button>
              <Button 
                size="sm"
                onClick={() => navigate("/auth")}
                className="gradient-primary shadow-glow text-xs px-3 active:scale-95 transition-transform"
              >
                Grátis
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 sm:pt-24 md:pt-32 pb-12 sm:pb-16 md:pb-20 px-4 gradient-primary relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-48 sm:w-64 h-48 sm:h-64 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-64 sm:w-96 h-64 sm:h-96 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        
        <div className="container mx-auto text-center text-white relative z-10 max-w-5xl">
          <div className="inline-block mb-4 sm:mb-6 p-2 sm:p-3 bg-white/10 backdrop-blur-sm rounded-xl">
            <Bot className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16" />
          </div>
          
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6 animate-fade-in leading-tight">
            Automatize seu WhatsApp<br />
            com Inteligência Artificial
          </h1>
          
          <p className="text-sm sm:text-base md:text-lg lg:text-xl mb-6 sm:mb-8 text-white/90 max-w-3xl mx-auto animate-fade-in px-2">
            Crie chatbots inteligentes e agentes IA para seu WhatsApp em minutos.
            Sem programação. Teste grátis por 3 dias.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center animate-scale-in px-2 max-w-md sm:max-w-none mx-auto">
            <Button 
              size="lg" 
              onClick={() => navigate("/auth")}
              className="w-full sm:w-auto bg-white text-primary hover:bg-white/90 shadow-glow text-sm sm:text-base md:text-lg px-6 sm:px-8 py-5 sm:py-6 active:scale-95 transition-transform"
            >
              Começar Teste Grátis 🚀
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="w-full sm:w-auto bg-green-400/20 border-white text-white hover:bg-green-400/30 text-sm sm:text-base md:text-lg px-6 sm:px-8 py-5 sm:py-6 active:scale-95 transition-transform"
              onClick={() => document.getElementById('recursos')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Ver Recursos
            </Button>
          </div>
          
          <div className="mt-6 sm:mt-8 md:mt-12 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 md:gap-8 text-xs sm:text-sm px-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span>3 dias grátis</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span>Sem cartão</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span>Cancele quando quiser</span>
            </div>
          </div>
        </div>
      </section>

      {/* Video Section */}
      {videoUrl && (
        <section className="py-10 sm:py-16 md:py-20 px-4 bg-muted/30">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-6 sm:mb-10 md:mb-12">
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-2 sm:mb-3 md:mb-4">
                Veja o Bot Reals Zapp em Ação
              </h2>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground px-2">
                Descubra como é fácil automatizar seu WhatsApp
              </p>
            </div>
            
            <div className="relative w-full aspect-video rounded-lg sm:rounded-xl md:rounded-2xl overflow-hidden shadow-2xl bg-muted">
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
      <section id="recursos" className="py-10 sm:py-16 md:py-20 px-4 bg-background">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-8 sm:mb-12 md:mb-16 px-2">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-2 sm:mb-3 md:mb-4">
              Recursos Poderosos para seu Negócio
            </h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto">
              Tudo que você precisa para automatizar e escalar seu atendimento no WhatsApp
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6 lg:gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-card p-5 sm:p-6 md:p-8 rounded-xl border border-border hover:shadow-xl transition-smooth hover-scale"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="bg-primary/10 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg md:rounded-xl flex items-center justify-center mb-3 sm:mb-4 md:mb-6">
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-primary" />
                  </div>
                  <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold mb-1 sm:mb-2 md:mb-3">{feature.title}</h3>
                  <p className="text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="planos" className="py-10 sm:py-16 md:py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-8 sm:mb-12 md:mb-16 px-2">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-2 sm:mb-3 md:mb-4">
              Escolha o Plano Ideal
            </h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto">
              Comece grátis e escale conforme seu negócio cresce
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 lg:gap-8 max-w-6xl mx-auto">
            {plans.map((plan) => {
              const isPopular = plan.plan_type === 'monthly' && plan.price > 50 && plan.price < 150;
              const features = Array.isArray(plan.features) ? plan.features : [];
              
              return (
                <div
                  key={plan.id}
                  className={`bg-card p-5 sm:p-6 md:p-8 rounded-xl border-2 transition-smooth hover-scale ${
                    isPopular 
                      ? 'border-primary shadow-glow relative' 
                      : 'border-border'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white px-3 py-1 rounded-full text-xs font-semibold">
                      Mais Popular
                    </div>
                  )}
                  
                  <div className="mb-4 sm:mb-6">
                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-2">{plan.name}</h3>
                    <p className="text-muted-foreground text-xs sm:text-sm">{plan.description}</p>
                  </div>
                  
                  <div className="mb-5 sm:mb-6 md:mb-8">
                    <span className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold">
                      R$ {plan.price}
                    </span>
                    <span className="text-xs sm:text-sm md:text-base text-muted-foreground">
                      /{plan.duration_days} dias
                    </span>
                  </div>
                  
                  <ul className="space-y-2 sm:space-y-3">
                    {features.map((feature: string, featureIndex: number) => (
                      <li key={featureIndex} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-xs sm:text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
          
          <div className="text-center mt-8 sm:mt-10 md:mt-12">
            <Button 
              size="lg"
              onClick={() => navigate("/auth")}
              className="gradient-primary shadow-glow text-sm sm:text-base md:text-lg px-6 sm:px-8 md:px-12 py-5 sm:py-6 md:py-7 active:scale-95 transition-transform w-full sm:w-auto max-w-md"
            >
              Começar Teste Grátis - 3 Dias 🚀
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-10 sm:py-16 md:py-20 px-4 gradient-primary relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 right-10 w-48 sm:w-64 h-48 sm:h-64 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 left-10 w-64 sm:w-96 h-64 sm:h-96 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        
        <div className="container mx-auto text-center text-white relative z-10 max-w-4xl px-2">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4 md:mb-6">
            Pronto para Transformar seu Atendimento?
          </h2>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl mb-5 sm:mb-6 md:mb-8 text-white/90 max-w-2xl mx-auto">
            Junte-se a centenas de empresas que já automatizaram seu WhatsApp com sucesso
          </p>
          <Button 
            size="lg"
            onClick={() => navigate("/auth")}
            className="w-full sm:w-auto max-w-md bg-white text-primary hover:bg-white/90 shadow-glow text-sm sm:text-base md:text-lg px-6 sm:px-8 py-5 sm:py-6 active:scale-95 transition-transform"
          >
            Começar Agora - 3 Dias Grátis 🚀
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-5 sm:py-6 md:py-8 px-4 bg-muted/30 border-t border-border">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
              © 2024 Bot Reals Zapp. Todos os direitos reservados.
            </p>
            {footerPages.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
                {footerPages.map((page) => (
                  <button
                    key={page.id}
                    onClick={() => page.open_as_popup && openPageDialog(page)}
                    className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-smooth"
                  >
                    {page.title}
                  </button>
                ))}
              </div>
            )}
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