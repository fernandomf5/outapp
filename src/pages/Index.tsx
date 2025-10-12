import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Sparkles, Zap, MessageSquare, Shield, TrendingUp, Clock, Check, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  const features = [
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
      icon: Zap,
      title: "Integração WhatsApp",
      description: "Conecte facilmente via QR Code e comece a automatizar em minutos",
    },
    {
      icon: MessageSquare,
      title: "Respostas 24/7",
      description: "Atendimento automático que nunca dorme, sempre disponível para seus clientes",
    },
    {
      icon: Shield,
      title: "Seguro e Confiável",
      description: "Seus dados protegidos com a melhor tecnologia de segurança",
    },
    {
      icon: TrendingUp,
      title: "Aumente suas Vendas",
      description: "Converta mais leads com respostas instantâneas e personalizadas",
    },
  ];

  const plans = [
    {
      name: "Trial Gratuito",
      price: "R$ 0",
      period: "3 dias grátis",
      description: "Perfeito para testar todas as funcionalidades",
      features: [
        "Acesso completo por 3 dias",
        "Criar até 3 chatbots",
        "Agentes IA ilimitados",
        "1 conexão WhatsApp",
        "Suporte por email",
      ],
      highlighted: false,
    },
    {
      name: "Profissional",
      price: "R$ 97",
      period: "/mês",
      description: "Ideal para profissionais e pequenas empresas",
      features: [
        "Chatbots ilimitados",
        "Agentes IA ilimitados",
        "Até 5 conexões WhatsApp",
        "Suporte prioritário",
        "Análises avançadas",
        "Treinamento personalizado",
      ],
      highlighted: true,
    },
    {
      name: "Empresarial",
      price: "R$ 297",
      period: "/mês",
      description: "Para empresas que precisam de mais poder",
      features: [
        "Tudo do plano Profissional",
        "Conexões WhatsApp ilimitadas",
        "API personalizada",
        "Suporte 24/7",
        "Consultor dedicado",
        "White label",
      ],
      highlighted: false,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-background/80 backdrop-blur-lg z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 p-2 rounded-xl">
                <Bot className="w-6 h-6 text-primary" />
              </div>
              <span className="text-xl font-bold">ChatBot Pro</span>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => navigate("/auth")}>
                Entrar
              </Button>
              <Button onClick={() => navigate("/auth")} className="gradient-primary shadow-glow">
                Começar Grátis
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-6 text-sm px-4 py-2">
              <Clock className="w-3 h-3 mr-2" />
              3 dias grátis • Sem cartão de crédito
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Automatize seu WhatsApp com Inteligência Artificial
            </h1>
            <p className="text-xl sm:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Crie chatbots e agentes de IA em minutos. Atenda seus clientes 24/7 e aumente suas vendas automaticamente.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                size="lg"
                onClick={() => navigate("/auth")}
                className="gradient-primary shadow-glow text-lg px-8 py-6 w-full sm:w-auto"
              >
                Começar Teste Grátis
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-lg px-8 py-6 w-full sm:w-auto"
              >
                Ver Planos
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              ✨ Sem compromisso • Cancele quando quiser
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 sm:py-32 bg-accent/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <Badge className="mb-4">Funcionalidades</Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Tudo que você precisa em um só lugar
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Ferramentas profissionais para automatizar seu atendimento e escalar seu negócio
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="glass hover:shadow-glow transition-smooth">
                <CardHeader>
                  <div className="bg-primary/10 p-3 rounded-2xl w-fit mb-4">
                    <feature.icon className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section id="plans" className="py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <Badge className="mb-4">Planos e Preços</Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Escolha o plano ideal para você
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comece gratuitamente e escale conforme seu negócio cresce
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <Card
                key={index}
                className={`relative ${
                  plan.highlighted
                    ? "border-primary shadow-glow scale-105"
                    : "glass"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-4 py-1">
                      Mais Popular
                    </Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, fIndex) => (
                      <li key={fIndex} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full ${
                      plan.highlighted
                        ? "gradient-primary shadow-glow"
                        : ""
                    }`}
                    variant={plan.highlighted ? "default" : "outline"}
                    size="lg"
                    onClick={() => navigate("/auth")}
                  >
                    {index === 0 ? "Começar Teste Grátis" : "Assinar Agora"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-32 bg-gradient-to-br from-primary/10 via-background to-primary/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Pronto para transformar seu atendimento?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Junte-se a centenas de empresas que já automatizam seus WhatsApp com nossa plataforma
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/auth")}
            className="gradient-primary shadow-glow text-lg px-8 py-6"
          >
            Começar Teste Grátis de 3 Dias
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            Não precisa cartão de crédito • Suporte em português
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center text-muted-foreground">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="bg-primary/10 p-2 rounded-xl">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <span className="font-bold text-foreground">ChatBot Pro</span>
          </div>
          <p>© 2024 ChatBot Pro. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
