import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Sparkles,
  Save,
  Play,
  Store,
  GraduationCap,
  Stethoscope,
  UtensilsCrossed,
  Home,
  Briefcase,
  ShoppingCart,
  Zap,
  Brain,
  MessageSquare,
  Clock,
  Target,
  Settings2,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";

interface NicheConfig {
  id: string;
  name: string;
  icon: any;
  questions: { label: string; placeholder: string; field: string }[];
  examples: string[];
}

const nicheConfigs: NicheConfig[] = [
  {
    id: "ecommerce",
    name: "E-commerce / Loja Virtual",
    icon: Store,
    questions: [
      { label: "Principais produtos/serviços", placeholder: "Ex: Roupas femininas, calçados...", field: "products" },
      { label: "Processo de compra", placeholder: "Como funciona pedido, pagamento, entrega...", field: "process" },
      { label: "Políticas (troca, devolução)", placeholder: "Detalhes sobre garantias e devoluções...", field: "policies" },
      { label: "Formas de pagamento", placeholder: "PIX, cartão, boleto...", field: "payment" },
    ],
    examples: ["Olá! Vi seus produtos e gostaria de comprar", "Quanto custa o frete?", "Como funciona a troca?"],
  },
  {
    id: "health",
    name: "Saúde / Clínica",
    icon: Stethoscope,
    questions: [
      { label: "Especialidades oferecidas", placeholder: "Ex: Cardiologia, ortopedia...", field: "specialties" },
      { label: "Horário de atendimento", placeholder: "Seg-Sex 8h-18h...", field: "schedule" },
      { label: "Como agendar consulta", placeholder: "Processo de agendamento...", field: "booking" },
      { label: "Convênios aceitos", placeholder: "Unimed, Bradesco Saúde...", field: "insurance" },
    ],
    examples: ["Gostaria de agendar uma consulta", "Vocês aceitam meu convênio?", "Qual o valor da consulta?"],
  },
  {
    id: "education",
    name: "Educação / Cursos",
    icon: GraduationCap,
    questions: [
      { label: "Cursos oferecidos", placeholder: "Lista de cursos e programas...", field: "courses" },
      { label: "Duração e formato", placeholder: "Presencial, online, duração...", field: "format" },
      { label: "Valores e formas de pagamento", placeholder: "Preços e opções de parcelamento...", field: "pricing" },
      { label: "Certificação", placeholder: "Tipo de certificado oferecido...", field: "certification" },
    ],
    examples: ["Quais cursos vocês oferecem?", "Quanto custa o curso de...", "Tem certificado?"],
  },
  {
    id: "restaurant",
    name: "Restaurante / Food Service",
    icon: UtensilsCrossed,
    questions: [
      { label: "Tipo de cozinha e cardápio", placeholder: "Italiana, brasileira, pratos principais...", field: "menu" },
      { label: "Horário de funcionamento", placeholder: "Horários de almoço, jantar...", field: "hours" },
      { label: "Delivery e retirada", placeholder: "Áreas de entrega, tempo médio...", field: "delivery" },
      { label: "Reservas", placeholder: "Como fazer reservas...", field: "reservations" },
    ],
    examples: ["Gostaria de fazer um pedido", "Vocês entregam no meu bairro?", "Qual o prato do dia?"],
  },
  {
    id: "realestate",
    name: "Imobiliária",
    icon: Home,
    questions: [
      { label: "Tipos de imóveis", placeholder: "Casas, apartamentos, comercial...", field: "properties" },
      { label: "Regiões de atuação", placeholder: "Bairros e cidades...", field: "locations" },
      { label: "Serviços oferecidos", placeholder: "Venda, aluguel, administração...", field: "services" },
      { label: "Processo de negociação", placeholder: "Como funciona visita, documentação...", field: "process" },
    ],
    examples: ["Procuro apartamento para alugar", "Quais imóveis disponíveis?", "Como agendar visita?"],
  },
  {
    id: "business",
    name: "Serviços Profissionais",
    icon: Briefcase,
    questions: [
      { label: "Serviços oferecidos", placeholder: "Lista de serviços principais...", field: "services" },
      { label: "Processo de contratação", placeholder: "Como contratar, orçamento...", field: "hiring" },
      { label: "Experiência e diferenciais", placeholder: "Tempo de mercado, cases...", field: "experience" },
      { label: "Valores e pagamento", placeholder: "Tabela de preços, formas...", field: "pricing" },
    ],
    examples: ["Preciso de um orçamento", "Quais serviços vocês oferecem?", "Quanto tempo leva?"],
  },
];

const AIAgentBuilder = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [agentName, setAgentName] = useState("Novo Agente IA");
  const [selectedNiche, setSelectedNiche] = useState<string>("");
  const [nicheData, setNicheData] = useState<Record<string, string>>({});
  const [personality, setPersonality] = useState({
    tone: "friendly",
    formality: 50,
    proactivity: 70,
    empathy: 80,
  });
  const [knowledge, setKnowledge] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState("Olá! Sou seu assistente virtual. Como posso ajudar você hoje?");
  const [testMessage, setTestMessage] = useState("");
  const [testResponse, setTestResponse] = useState("");

  const currentNiche = nicheConfigs.find(n => n.id === selectedNiche);

  const handleNicheDataChange = (field: string, value: string) => {
    setNicheData({ ...nicheData, [field]: value });
  };

  const handleTest = () => {
    // Simular resposta inteligente baseada nas configurações
    const responses = [
      `Olá! ${testMessage.includes("preço") || testMessage.includes("valor") ? "Vou te ajudar com informações sobre valores e formas de pagamento." : ""}`,
      `Com base no seu interesse, posso te ajudar com ${currentNiche?.name.toLowerCase()}. ${testMessage}`,
      `Perfeito! Deixa eu te ajudar com isso. ${testMessage.includes("?") ? "Vou buscar essa informação para você." : "O que mais gostaria de saber?"}`,
    ];
    setTestResponse(responses[Math.floor(Math.random() * responses.length)]);
    toast({
      title: "Resposta gerada! 🤖",
      description: "Seu agente IA respondeu com base no treinamento.",
    });
  };

  const handleSave = () => {
    toast({
      title: "Agente IA salvo! 🚀",
      description: "Seu agente inteligente está pronto para uso.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Input
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              className="text-xl font-bold border-none bg-transparent max-w-xs"
            />
            <div className="bg-primary/10 px-3 py-1 rounded-full text-sm font-medium text-primary flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Agente IA
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleTest}>
              <Play className="w-4 h-4 mr-2" />
              Testar
            </Button>
            <Button onClick={handleSave} className="gradient-primary shadow-glow">
              <Save className="w-4 h-4 mr-2" />
              Salvar Agente
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs defaultValue="niche" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="niche" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Nicho
            </TabsTrigger>
            <TabsTrigger value="personality" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Personalidade
            </TabsTrigger>
            <TabsTrigger value="knowledge" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Base de Conhecimento
            </TabsTrigger>
            <TabsTrigger value="test" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Testar
            </TabsTrigger>
          </TabsList>

          {/* Seleção de Nicho */}
          <TabsContent value="niche" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Target className="w-6 h-6 text-primary" />
                Escolha o Nicho do seu Agente IA
              </h2>
              <p className="text-muted-foreground mb-6">
                Selecione o segmento do seu negócio para personalizar o agente com perguntas específicas
              </p>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {nicheConfigs.map((niche) => {
                  const Icon = niche.icon;
                  return (
                    <Card
                      key={niche.id}
                      className={`p-4 cursor-pointer transition-smooth hover:shadow-glow ${
                        selectedNiche === niche.id
                          ? "border-primary bg-primary/5"
                          : "hover:border-primary/50"
                      }`}
                      onClick={() => setSelectedNiche(niche.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="bg-primary/10 p-3 rounded-xl">
                          <Icon className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">{niche.name}</h3>
                          <p className="text-xs text-muted-foreground">
                            {niche.questions.length} perguntas personalizadas
                          </p>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>

              {currentNiche && (
                <div className="space-y-6 animate-fade-in">
                  <div className="bg-primary/5 p-6 rounded-xl border border-primary/20">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                      <Settings2 className="w-5 h-5 text-primary" />
                      Configuração: {currentNiche.name}
                    </h3>
                    <div className="space-y-4">
                      {currentNiche.questions.map((q) => (
                        <div key={q.field}>
                          <Label className="mb-2">{q.label}</Label>
                          <Textarea
                            placeholder={q.placeholder}
                            value={nicheData[q.field] || ""}
                            onChange={(e) => handleNicheDataChange(q.field, e.target.value)}
                            rows={3}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-accent/50 p-6 rounded-xl">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Exemplos de perguntas que seu agente poderá responder:
                    </h4>
                    <ul className="space-y-2">
                      {currentNiche.examples.map((example, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="text-primary">•</span>
                          {example}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Personalidade */}
          <TabsContent value="personality" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Brain className="w-6 h-6 text-primary" />
                Configure a Personalidade do Agente
              </h2>
              <p className="text-muted-foreground mb-6">
                Defina como seu agente IA deve se comunicar com os clientes
              </p>

              <div className="space-y-8">
                <div>
                  <Label className="mb-3 block">Tom de Voz</Label>
                  <Select value={personality.tone} onValueChange={(v) => setPersonality({...personality, tone: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="friendly">Amigável e Casual</SelectItem>
                      <SelectItem value="professional">Profissional</SelectItem>
                      <SelectItem value="enthusiastic">Entusiasmado</SelectItem>
                      <SelectItem value="calm">Calmo e Sereno</SelectItem>
                      <SelectItem value="humorous">Com Humor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="mb-3 block">Nível de Formalidade: {personality.formality}%</Label>
                  <Slider
                    value={[personality.formality]}
                    onValueChange={(v) => setPersonality({...personality, formality: v[0]})}
                    max={100}
                    step={10}
                    className="mb-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Informal</span>
                    <span>Formal</span>
                  </div>
                </div>

                <div>
                  <Label className="mb-3 block">Proatividade: {personality.proactivity}%</Label>
                  <Slider
                    value={[personality.proactivity]}
                    onValueChange={(v) => setPersonality({...personality, proactivity: v[0]})}
                    max={100}
                    step={10}
                    className="mb-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Aguarda perguntas</span>
                    <span>Oferece ajuda ativamente</span>
                  </div>
                </div>

                <div>
                  <Label className="mb-3 block">Empatia: {personality.empathy}%</Label>
                  <Slider
                    value={[personality.empathy]}
                    onValueChange={(v) => setPersonality({...personality, empathy: v[0]})}
                    max={100}
                    step={10}
                    className="mb-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Objetivo e direto</span>
                    <span>Empático e compreensivo</span>
                  </div>
                </div>

                <div>
                  <Label className="mb-3 block">Mensagem de Boas-vindas</Label>
                  <Textarea
                    value={welcomeMessage}
                    onChange={(e) => setWelcomeMessage(e.target.value)}
                    rows={4}
                    placeholder="Digite a mensagem inicial do agente..."
                  />
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Base de Conhecimento */}
          <TabsContent value="knowledge" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <MessageSquare className="w-6 h-6 text-primary" />
                Base de Conhecimento Adicional
              </h2>
              <p className="text-muted-foreground mb-6">
                Adicione informações extras para deixar seu agente ainda mais inteligente
              </p>

              <div className="space-y-4">
                <div>
                  <Label className="mb-3 block">Conhecimento Específico do Negócio</Label>
                  <Textarea
                    value={knowledge}
                    onChange={(e) => setKnowledge(e.target.value)}
                    rows={12}
                    placeholder="Cole aqui informações importantes sobre:&#10;• História da empresa&#10;• Produtos e serviços em detalhes&#10;• Perguntas frequentes e respostas&#10;• Políticas e procedimentos&#10;• Diferenciais competitivos&#10;• Qualquer informação que o agente deva saber..."
                  />
                </div>

                <div className="bg-accent/50 p-6 rounded-xl">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Dicas para Treinamento Eficaz:
                  </h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex gap-2">
                      <span>•</span>
                      <span>Seja específico e detalhado nas informações</span>
                    </li>
                    <li className="flex gap-2">
                      <span>•</span>
                      <span>Use exemplos reais de situações e respostas</span>
                    </li>
                    <li className="flex gap-2">
                      <span>•</span>
                      <span>Inclua variações de perguntas que clientes costumam fazer</span>
                    </li>
                    <li className="flex gap-2">
                      <span>•</span>
                      <span>Atualize frequentemente com novos casos e informações</span>
                    </li>
                  </ul>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Teste */}
          <TabsContent value="test" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Zap className="w-6 h-6 text-primary" />
                  Teste seu Agente IA
                </h2>
                <p className="text-muted-foreground mb-6">
                  Simule uma conversa para ver como seu agente responde
                </p>

                <div className="space-y-4">
                  <div>
                    <Label className="mb-3 block">Mensagem do Cliente</Label>
                    <Textarea
                      value={testMessage}
                      onChange={(e) => setTestMessage(e.target.value)}
                      rows={4}
                      placeholder="Digite uma pergunta que um cliente faria..."
                    />
                  </div>

                  <Button onClick={handleTest} className="w-full gradient-primary shadow-glow">
                    <Play className="w-4 h-4 mr-2" />
                    Gerar Resposta do Agente
                  </Button>

                  {testResponse && (
                    <div className="bg-primary/5 p-6 rounded-xl border border-primary/20 animate-fade-in">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="bg-primary/10 p-2 rounded-lg">
                          <Sparkles className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold">Resposta do Agente IA</h4>
                          <p className="text-xs text-muted-foreground">Gerado com base no treinamento</p>
                        </div>
                      </div>
                      <p className="text-foreground leading-relaxed">{testResponse}</p>
                    </div>
                  )}
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4">Preview de Configuração</h3>
                
                <div className="space-y-4">
                  <div className="p-4 bg-accent/50 rounded-lg">
                    <h4 className="font-semibold text-sm mb-2">Nome do Agente</h4>
                    <p className="text-foreground">{agentName}</p>
                  </div>

                  {selectedNiche && (
                    <div className="p-4 bg-accent/50 rounded-lg">
                      <h4 className="font-semibold text-sm mb-2">Nicho</h4>
                      <p className="text-foreground">{currentNiche?.name}</p>
                    </div>
                  )}

                  <div className="p-4 bg-accent/50 rounded-lg">
                    <h4 className="font-semibold text-sm mb-2">Personalidade</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tom:</span>
                        <span className="text-foreground capitalize">{personality.tone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Formalidade:</span>
                        <span className="text-foreground">{personality.formality}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Proatividade:</span>
                        <span className="text-foreground">{personality.proactivity}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Empatia:</span>
                        <span className="text-foreground">{personality.empathy}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      Mensagem Inicial
                    </h4>
                    <p className="text-sm text-foreground">{welcomeMessage}</p>
                  </div>

                  {knowledge && (
                    <div className="p-4 bg-accent/50 rounded-lg">
                      <h4 className="font-semibold text-sm mb-2">Base de Conhecimento</h4>
                      <p className="text-xs text-muted-foreground">
                        {knowledge.length} caracteres de treinamento
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AIAgentBuilder;