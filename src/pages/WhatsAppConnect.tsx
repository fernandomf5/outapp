import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, QrCode, CheckCircle, Bot, Zap, Loader2, MessageSquare, Settings as SettingsIcon, Send, RefreshCw, Clock, Tag, Users, BarChart3, Bell, Star, Filter, Calendar, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

const WhatsAppConnect = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [showWhatsAppWeb, setShowWhatsAppWeb] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  
  // Bot Configuration State
  const [botConfig, setBotConfig] = useState({
    welcomeMessage: "Olá! 👋 Bem-vindo ao nosso atendimento. Como posso ajudar?",
    awayMessage: "Estamos fora do horário de atendimento. Responderemos em breve!",
    autoReply: true,
    aiMode: false,
    businessHours: {
      enabled: false,
      start: "09:00",
      end: "18:00",
      days: ["seg", "ter", "qua", "qui", "sex"]
    },
    notifications: {
      sound: true,
      desktop: true,
      mobile: true
    },
    quickReplies: [
      { id: 1, title: "Saudação", text: "Olá! Como posso ajudar você hoje?" },
      { id: 2, title: "Horário", text: "Nosso horário de atendimento é de segunda a sexta, das 9h às 18h." },
      { id: 3, title: "Agradecimento", text: "Obrigado por entrar em contato! Ficamos felizes em ajudar." }
    ],
    triggers: [
      { id: 1, keyword: "preço", response: "Nossos planos começam em R$ 49,90/mês" },
      { id: 2, keyword: "horário", response: "Atendemos de segunda a sexta, das 9h às 18h" }
    ],
    tags: ["Atendimento", "Vendas", "Suporte", "Urgente"],
    analytics: {
      totalMessages: 245,
      avgResponseTime: "2.3 min",
      satisfaction: 4.7,
      activeChats: 12
    }
  });

  // Test Message State
  const [testMessage, setTestMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ text: string; sender: "user" | "bot"; time: string }>>([
    { text: "Olá! Como posso te ajudar?", sender: "bot", time: "14:30" }
  ]);

  const handleConnect = () => {
    setIsConnecting(true);
    // Simulate connection process
    setTimeout(() => {
      setIsConnecting(false);
      setIsConnected(true);
      setShowWhatsAppWeb(true);
      toast({
        title: "WhatsApp Conectado! ✅",
        description: "Sua conta foi conectada com sucesso. Agora você pode configurar seu bot!",
      });
    }, 2000);
  };

  const handleSaveConfig = () => {
    toast({
      title: "Configurações Salvas! 💾",
      description: "As configurações do bot foram atualizadas.",
    });
  };

  const handleTestMessage = () => {
    if (!testMessage.trim()) return;

    // Add user message
    const userMsg = {
      text: testMessage,
      sender: "user" as const,
      time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    };
    setChatMessages([...chatMessages, userMsg]);

    // Simulate bot response
    setTimeout(() => {
      const botResponse = {
        text: botConfig.aiMode 
          ? "Como assistente IA, posso ajudá-lo com informações detalhadas sobre nossos produtos e serviços. Como posso auxiliá-lo?"
          : botConfig.welcomeMessage,
        sender: "bot" as const,
        time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
      };
      setChatMessages(prev => [...prev, botResponse]);
    }, 1000);

    setTestMessage("");
  };

  const handleReconnect = () => {
    setIsConnected(false);
    setShowWhatsAppWeb(false);
    toast({
      title: "Desconectado",
      description: "Você foi desconectado do WhatsApp.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Conectar WhatsApp</h1>
            <p className="text-sm text-muted-foreground">
              {showWhatsAppWeb ? "Configure seu bot em tempo real" : "Conexão rápida via QR Code"}
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {!showWhatsAppWeb ? (
          <div className="grid md:grid-cols-2 gap-8 items-start">
            {/* QR Code Area */}
            <Card className="p-8 text-center glass">
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">Escaneie o QR Code</h2>
                <p className="text-muted-foreground">
                  Use seu WhatsApp para escanear o código
                </p>
              </div>

              {!isConnecting ? (
                <div className="bg-accent/30 rounded-2xl p-8 mb-6">
                  <QrCode className="w-48 h-48 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mt-4">
                    Clique em "Gerar QR Code" para começar
                  </p>
                </div>
              ) : (
                <div className="bg-accent/30 rounded-2xl p-8 mb-6 flex flex-col items-center justify-center">
                  <Loader2 className="w-16 h-16 animate-spin text-primary mb-4" />
                  <p className="text-sm text-muted-foreground">Aguardando conexão...</p>
                </div>
              )}

              <Button
                onClick={handleConnect}
                disabled={isConnecting}
                className="w-full gradient-primary shadow-glow"
                size="lg"
              >
                {isConnecting ? "Conectando..." : "Gerar QR Code"}
              </Button>
            </Card>

            {/* Instructions */}
            <div className="space-y-6">
              <Card className="p-6 glass">
                <h3 className="text-xl font-bold mb-4">📱 Como Conectar</h3>
                <ol className="space-y-3 text-muted-foreground">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary/20 text-primary rounded-full flex items-center justify-center text-sm font-semibold">
                      1
                    </span>
                    <span>Abra o WhatsApp no seu celular</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary/20 text-primary rounded-full flex items-center justify-center text-sm font-semibold">
                      2
                    </span>
                    <span>Toque em Menu (⋮) ou Configurações</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary/20 text-primary rounded-full flex items-center justify-center text-sm font-semibold">
                      3
                    </span>
                    <span>Selecione "Aparelhos conectados"</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary/20 text-primary rounded-full flex items-center justify-center text-sm font-semibold">
                      4
                    </span>
                    <span>Toque em "Conectar um aparelho"</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary/20 text-primary rounded-full flex items-center justify-center text-sm font-semibold">
                      5
                    </span>
                    <span>Escaneie o QR code na tela</span>
                  </li>
                </ol>
              </Card>

              <Card className="p-6 bg-primary/5 border-primary/20">
                <h3 className="text-lg font-semibold mb-2 text-primary flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Recursos Disponíveis
                </h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>✅ WhatsApp Web integrado na plataforma</li>
                  <li>✅ Edição de chatbot em tempo real</li>
                  <li>✅ Teste suas automações instantaneamente</li>
                  <li>✅ Configuração de agente IA avançado</li>
                </ul>
              </Card>
            </div>
          </div>
        ) : (
          <div className="animate-fade-in">
            {/* WhatsApp Web Integration */}
            <div className="grid lg:grid-cols-3 gap-6">
              {/* WhatsApp Web Viewer */}
              <Card className="lg:col-span-2 p-6 glass">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-success rounded-full animate-pulse"></div>
                    <h2 className="text-xl font-bold">WhatsApp Web</h2>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleReconnect}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reconectar
                  </Button>
                </div>

                {/* Simulated WhatsApp Interface */}
                <div className="bg-[#0a1014] rounded-xl overflow-hidden border-2 border-primary/20 shadow-glow">
                  {/* Header */}
                  <div className="bg-[#1f2c34] p-4 flex items-center gap-3 border-b border-border/50">
                    <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                      <Bot className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Bot Reals Zapp</h3>
                      <p className="text-xs text-success">Online</p>
                    </div>
                  </div>

                  {/* Chat Area */}
                  <div className="h-[400px] bg-[#0a1014] p-4 overflow-y-auto space-y-3">
                    {chatMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            msg.sender === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-[#1f2c34] text-white"
                          }`}
                        >
                          <p className="text-sm">{msg.text}</p>
                          <p className="text-xs opacity-70 mt-1 text-right">{msg.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Input Area */}
                  <div className="bg-[#1f2c34] p-4 border-t border-border/50 flex gap-2">
                    <Input
                      value={testMessage}
                      onChange={(e) => setTestMessage(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleTestMessage()}
                      placeholder="Digite uma mensagem de teste..."
                      className="flex-1 bg-[#2a3942] border-none text-white"
                    />
                    <Button onClick={handleTestMessage} size="icon" className="gradient-primary">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground mt-4 text-center">
                  💡 Esta é uma simulação do WhatsApp Web integrado à plataforma. Configure seu bot ao lado e teste em tempo real!
                </p>
              </Card>

              {/* Bot Configuration Panel */}
              <Card className="p-6 glass">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-primary/10 p-3 rounded-xl">
                    <SettingsIcon className="w-6 h-6 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold">Configurações</h2>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-3 gap-1 mb-4">
                    <TabsTrigger value="chat" className="text-xs">Chat</TabsTrigger>
                    <TabsTrigger value="ai" className="text-xs">IA</TabsTrigger>
                    <TabsTrigger value="advanced" className="text-xs">Avançado</TabsTrigger>
                  </TabsList>

                  <TabsContent value="chat" className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Mensagem de Boas-vindas</label>
                      <Textarea
                        value={botConfig.welcomeMessage}
                        onChange={(e) => setBotConfig({ ...botConfig, welcomeMessage: e.target.value })}
                        rows={3}
                        placeholder="Digite a mensagem de boas-vindas..."
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Mensagem Fora do Horário</label>
                      <Textarea
                        value={botConfig.awayMessage}
                        onChange={(e) => setBotConfig({ ...botConfig, awayMessage: e.target.value })}
                        rows={3}
                        placeholder="Digite a mensagem para horário fora de expediente..."
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                      <span className="text-sm font-medium">Resposta Automática</span>
                      <Button
                        variant={botConfig.autoReply ? "default" : "outline"}
                        size="sm"
                        onClick={() => setBotConfig({ ...botConfig, autoReply: !botConfig.autoReply })}
                      >
                        {botConfig.autoReply ? "Ativo" : "Inativo"}
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="ai" className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                      <div>
                        <span className="text-sm font-medium block">Modo IA</span>
                        <span className="text-xs text-muted-foreground">Atendimento inteligente</span>
                      </div>
                      <Switch
                        checked={botConfig.aiMode}
                        onCheckedChange={(checked) => setBotConfig({ ...botConfig, aiMode: checked })}
                      />
                    </div>

                    {botConfig.aiMode && (
                      <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-primary" />
                          IA Ativa
                        </h4>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          <li>• Respostas contextuais inteligentes</li>
                          <li>• Aprendizado com conversas</li>
                          <li>• Processamento de linguagem natural</li>
                          <li>• Análise de sentimento do cliente</li>
                          <li>• Sugestões automáticas de resposta</li>
                        </ul>
                        
                        <Button variant="outline" size="sm" className="w-full mt-3" onClick={() => navigate("/ai-agent")}>
                          <Bot className="w-3 h-3 mr-2" />
                          Configurar Agente IA
                        </Button>
                      </div>
                    )}

                    <Separator className="my-4" />

                    <div>
                      <Label className="text-sm font-medium mb-2 block flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        Respostas Rápidas
                      </Label>
                      <div className="space-y-2">
                        {botConfig.quickReplies.map((reply) => (
                          <Card key={reply.id} className="p-3 bg-accent/30">
                            <div className="flex items-start justify-between mb-1">
                              <span className="text-xs font-semibold text-primary">{reply.title}</span>
                              <Star className="w-3 h-3 text-yellow-500" />
                            </div>
                            <p className="text-xs text-muted-foreground">{reply.text}</p>
                          </Card>
                        ))}
                      </div>
                      <Button variant="outline" size="sm" className="w-full mt-2">
                        + Adicionar Resposta Rápida
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="advanced" className="space-y-4">
                    {/* Horário de Atendimento */}
                    <div>
                      <Label className="text-sm font-medium mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Horário de Atendimento
                      </Label>
                      <div className="space-y-3 p-3 bg-accent/30 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-xs">Ativar horário</span>
                          <Switch
                            checked={botConfig.businessHours.enabled}
                            onCheckedChange={(checked) => 
                              setBotConfig({
                                ...botConfig,
                                businessHours: { ...botConfig.businessHours, enabled: checked }
                              })
                            }
                          />
                        </div>
                        {botConfig.businessHours.enabled && (
                          <>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-xs">Início</Label>
                                <Input type="time" value={botConfig.businessHours.start} className="h-8 text-xs" />
                              </div>
                              <div>
                                <Label className="text-xs">Fim</Label>
                                <Input type="time" value={botConfig.businessHours.end} className="h-8 text-xs" />
                              </div>
                            </div>
                            <div className="flex gap-1 flex-wrap">
                              {["seg", "ter", "qua", "qui", "sex", "sáb", "dom"].map((day) => (
                                <Button
                                  key={day}
                                  variant={botConfig.businessHours.days.includes(day) ? "default" : "outline"}
                                  size="sm"
                                  className="h-7 px-2 text-xs"
                                >
                                  {day}
                                </Button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Gatilhos Automáticos */}
                    <div>
                      <Label className="text-sm font-medium mb-2 flex items-center gap-2">
                        <Filter className="w-4 h-4" />
                        Gatilhos Automáticos
                      </Label>
                      <div className="space-y-2">
                        {botConfig.triggers.map((trigger) => (
                          <Card key={trigger.id} className="p-3 bg-accent/30">
                            <div className="flex items-center gap-2 mb-1">
                              <Tag className="w-3 h-3 text-primary" />
                              <span className="text-xs font-semibold">Palavra-chave: "{trigger.keyword}"</span>
                            </div>
                            <p className="text-xs text-muted-foreground">→ {trigger.response}</p>
                          </Card>
                        ))}
                      </div>
                      <Button variant="outline" size="sm" className="w-full mt-2">
                        + Adicionar Gatilho
                      </Button>
                    </div>

                    {/* Tags */}
                    <div>
                      <Label className="text-sm font-medium mb-2 flex items-center gap-2">
                        <Tag className="w-4 h-4" />
                        Tags de Categorização
                      </Label>
                      <div className="flex flex-wrap gap-2 p-3 bg-accent/30 rounded-lg">
                        {botConfig.tags.map((tag, idx) => (
                          <span key={idx} className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-full">
                            #{tag}
                          </span>
                        ))}
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                          + Nova Tag
                        </Button>
                      </div>
                    </div>

                    {/* Notificações */}
                    <div>
                      <Label className="text-sm font-medium mb-2 flex items-center gap-2">
                        <Bell className="w-4 h-4" />
                        Notificações
                      </Label>
                      <div className="space-y-2 p-3 bg-accent/30 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-xs">Som</span>
                          <Switch checked={botConfig.notifications.sound} />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs">Desktop</span>
                          <Switch checked={botConfig.notifications.desktop} />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs">Mobile</span>
                          <Switch checked={botConfig.notifications.mobile} />
                        </div>
                      </div>
                    </div>

                    {/* Analytics */}
                    <div>
                      <Label className="text-sm font-medium mb-2 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Estatísticas
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Card className="p-3 bg-primary/5">
                          <p className="text-xs text-muted-foreground">Total de Mensagens</p>
                          <p className="text-xl font-bold text-primary">{botConfig.analytics.totalMessages}</p>
                        </Card>
                        <Card className="p-3 bg-primary/5">
                          <p className="text-xs text-muted-foreground">Tempo Médio</p>
                          <p className="text-xl font-bold text-primary">{botConfig.analytics.avgResponseTime}</p>
                        </Card>
                        <Card className="p-3 bg-primary/5">
                          <p className="text-xs text-muted-foreground">Satisfação</p>
                          <p className="text-xl font-bold text-primary flex items-center gap-1">
                            {botConfig.analytics.satisfaction}
                            <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                          </p>
                        </Card>
                        <Card className="p-3 bg-primary/5">
                          <p className="text-xs text-muted-foreground">Chats Ativos</p>
                          <p className="text-xl font-bold text-primary">{botConfig.analytics.activeChats}</p>
                        </Card>
                      </div>
                      <Button variant="outline" size="sm" className="w-full mt-2">
                        <BarChart3 className="w-3 h-3 mr-2" />
                        Ver Relatório Completo
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>

                <Button onClick={handleSaveConfig} className="w-full mt-6 gradient-primary shadow-glow">
                  <SettingsIcon className="w-4 h-4 mr-2" />
                  Salvar Configurações
                </Button>

                <Separator className="my-4" />

                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate("/bot-builder")}
                  >
                    <Bot className="w-4 h-4 mr-2" />
                    Editor de Fluxo Avançado
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate("/ai-agent")}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Criar Agente IA
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate("/dashboard")}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar ao Dashboard
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default WhatsAppConnect;
