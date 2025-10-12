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
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <span className="text-lg sm:text-xl font-bold">Bot Reals Zapp</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-4 lg:gap-6">
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
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="md:hidden"
            onClick={() => navigate("/auth")}
          >
            Menu
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 sm:pt-32 pb-12 sm:pb-20 px-4 gradient-primary relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-48 sm:w-64 h-48 sm:h-64 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-64 sm:w-96 h-64 sm:h-96 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        
        <div className="container mx-auto text-center text-white relative z-10">
          <div className="inline-block mb-4 sm:mb-6 p-2 sm:p-3 bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl">
            <Bot className="w-12 h-12 sm:w-16 sm:h-16" />
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6 animate-fade-in px-2">
            Automatize seu WhatsApp<br className="hidden sm:block" />
            <span className="sm:hidden"> </span>com Inteligência Artificial
          </h1>
          
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-6 sm:mb-8 text-white/90 max-w-3xl mx-auto animate-fade-in px-4">
            Crie chatbots inteligentes e agentes IA para seu WhatsApp em minutos.<br className="hidden sm:block" />
            <span className="sm:hidden"> </span>Sem programação. Teste grátis por 3 dias.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center animate-scale-in px-4">
            <Button 
              size="lg" 
              onClick={() => navigate("/auth")}
              className="bg-white text-primary hover:bg-white/90 shadow-glow text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 w-full sm:w-auto active:scale-95 transition-transform"
            >
              Começar Teste Grátis 🚀
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="bg-green-400/20 border-white text-white hover:bg-green-400/30 text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 w-full sm:w-auto active:scale-95 transition-transform"
              onClick={() => document.getElementById('recursos')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Ver Recursos
            </Button>
          </div>
          
          <div className="mt-8 sm:mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-xs sm:text-sm px-4">
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
        <section className="py-12 sm:py-20 px-4 bg-muted/30">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
                Veja o Bot Reals Zapp em Ação
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground">
                Descubra como é fácil automatizar seu WhatsApp
              </p>
            </div>
            
            <div className="relative w-full aspect-video rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl">
              <iframe
                src={videoUrl}
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
      <section id="recursos" className="py-12 sm:py-20 px-4 bg-background">
        <div className="container mx-auto">
          <div className="text-center mb-10 sm:mb-16 px-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
              Recursos Poderosos para seu Negócio
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Tudo que você precisa para automatizar e escalar seu atendimento no WhatsApp
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 px-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-card p-6 sm:p-8 rounded-xl sm:rounded-2xl border border-border hover:shadow-xl transition-smooth hover-scale"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="bg-primary/10 w-12 h-12 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl flex items-center justify-center mb-4 sm:mb-6">
                    <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                  </div>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-2 sm:mb-3">{feature.title}</h3>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="planos" className="py-12 sm:py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-10 sm:mb-16 px-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
              Escolha o Plano Ideal
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Comece grátis e escale conforme seu negócio cresce
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 max-w-6xl mx-auto px-4">
            {plans.map((plan) => {
              const isPopular = plan.plan_type === 'monthly' && plan.price > 50 && plan.price < 150;
              const features = Array.isArray(plan.features) ? plan.features : [];
              
              return (
                <div
                  key={plan.id}
                  className={`bg-card p-6 sm:p-8 rounded-xl sm:rounded-2xl border-2 transition-smooth hover-scale ${
                    isPopular 
                      ? 'border-primary shadow-glow relative' 
                      : 'border-border'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2 bg-primary text-white px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm font-semibold">
                      Mais Popular
                    </div>
                  )}
                  
                  <div className="mb-4 sm:mb-6">
                    <h3 className="text-xl sm:text-2xl font-bold mb-2">{plan.name}</h3>
                    <p className="text-muted-foreground text-xs sm:text-sm">{plan.description}</p>
                  </div>
                  
                  <div className="mb-6 sm:mb-8">
                    <span className="text-3xl sm:text-4xl lg:text-5xl font-bold">
                      R$ {plan.price}
                    </span>
                    <span className="text-sm sm:text-base text-muted-foreground">
                      /{plan.duration_days} dias
                    </span>
                  </div>
                  
                  <ul className="space-y-3 sm:space-y-4">
                    {features.map((feature: string, featureIndex: number) => (
                      <li key={featureIndex} className="flex items-start gap-2 sm:gap-3">
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-xs sm:text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
          
          <div className="text-center mt-10 sm:mt-12">
            <Button 
              size="lg"
              onClick={() => navigate("/auth")}
              className="gradient-primary shadow-glow text-base sm:text-lg px-8 sm:px-12 py-5 sm:py-7 active:scale-95 transition-transform"
            >
              Começar Teste Grátis - 3 Dias 🚀
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-20 px-4 gradient-primary relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 right-10 w-48 sm:w-64 h-48 sm:h-64 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 left-10 w-64 sm:w-96 h-64 sm:h-96 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        
        <div className="container mx-auto text-center text-white relative z-10 px-4">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
            Pronto para Transformar seu Atendimento?
          </h2>
          <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 text-white/90 max-w-2xl mx-auto">
            Junte-se a centenas de empresas que já automatizaram seu WhatsApp com sucesso
          </p>
          <Button 
            size="lg"
            onClick={() => navigate("/auth")}
            className="bg-white text-primary hover:bg-white/90 shadow-glow text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 w-full sm:w-auto active:scale-95 transition-transform"
          >
            Começar Agora - 3 Dias Grátis 🚀
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 sm:py-8 px-4 bg-muted/30 border-t border-border">
        <div className="container mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground text-center sm:text-left">
              © 2024 Bot Reals Zapp. Todos os direitos reservados.
            </p>
            {footerPages.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-4">
                {footerPages.map((page) => (
                  <button
                    key={page.id}
                    onClick={() => page.open_as_popup && openPageDialog(page)}
                    className="text-sm text-muted-foreground hover:text-foreground transition-smooth"
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
          <div 
            className="prose prose-sm sm:prose max-w-none mt-4"
            dangerouslySetInnerHTML={{ __html: selectedPage?.content || '' }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;