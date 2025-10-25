import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAIAgent } from "@/hooks/useAIAgent";
import {
  ArrowLeft,
  Sparkles,
  Save,
  Play,
  Target,
  Settings2,
  Code2,
  Link2,
  Power,
  Brain,
  BookOpen,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { nicheConfigs } from "@/data/nicheConfigs";
import { ChatWidgetGenerator } from '@/components/ChatWidgetGenerator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from "@/components/ui/switch";
import { CustomCursor } from '@/components/CustomCursor';

const AIAgentBuilder = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const agentId = searchParams.get('id');
  
  const { saveAgent, loadAgent } = useAIAgent();
  
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
  const [isSaving, setIsSaving] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [nicheSearch, setNicheSearch] = useState("");

  const currentNiche = nicheConfigs.find(n => n.id === selectedNiche);
  const filteredNiches = nicheSearch
    ? nicheConfigs.filter(n => 
        n.name.toLowerCase().includes(nicheSearch.toLowerCase())
      )
    : nicheConfigs;

  useEffect(() => {
    if (agentId && user) {
      loadAgent(agentId).then(agent => {
        setAgentName(agent.name);
        setSelectedNiche(agent.niche);
        setNicheData(agent.training_data?.nicheData || {});
        setPersonality(agent.config?.personality || personality);
        setKnowledge(agent.training_data?.knowledge || "");
        setWelcomeMessage(agent.config?.welcomeMessage || welcomeMessage);
        setIsActive(agent.is_active);
      }).catch(console.error);
    }
  }, [agentId, user]);

  const handleNicheDataChange = (field: string, value: string) => {
    setNicheData({ ...nicheData, [field]: value });
  };

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const agentData = {
        id: agentId || undefined,
        name: agentName,
        niche: selectedNiche,
        config: {
          personality,
          welcomeMessage,
        },
        training_data: {
          nicheData,
          knowledge,
        },
        is_active: isActive,
      };

      const result = await saveAgent(agentData, user.id);
      
      if (!agentId && result) {
        navigate(`/ai-agent?id=${result.id}`);
      }
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyLink = () => {
    if (!agentId) {
      toast({
        title: "Salve primeiro! 💾",
        description: "Você precisa salvar o agente antes de gerar o link.",
        variant: "destructive",
      });
      return;
    }

    const slug = (agentName || '')
      .normalize('NFD').replace(/\p{Diacritic}/gu, '')
      .toLowerCase().trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

    const link = `${window.location.origin}/chat/${agentId}/${slug || 'agent'}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copiado! 🔗",
      description: "O link do agente foi copiado para a área de transferência.",
    });
  };

  const handleTestInNewTab = () => {
    if (!agentId) {
      toast({
        title: "Salve primeiro! 💾",
        description: "Você precisa salvar o agente antes de testar.",
        variant: "destructive",
      });
      return;
    }
    
    const slug = (agentName || '')
      .normalize('NFD').replace(/\p{Diacritic}/gu, '')
      .toLowerCase().trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    const link = `${window.location.origin}/chat/${agentId}/${slug || 'agent'}`;
    window.open(link, '_blank');
  };

  return (
    <>
      <CustomCursor />
      <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="bg-primary/10 px-3 py-1 rounded-full text-sm font-medium text-primary flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Agente IA
            </div>
          </div>

          <div className="flex items-center gap-3">
            {agentId && (
              <>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card">
                  <Label htmlFor="active-switch" className="">
                    <Power className="w-4 h-4" />
                  </Label>
                  <Switch
                    id="active-switch"
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                  <span className="text-sm font-medium">
                    {isActive ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <Button 
                  variant="outline" 
                  onClick={handleCopyLink}
                  className="hover:bg-primary/10 hover:border-primary"
                >
                  <Link2 className="w-4 h-4 mr-2" />
                  Copiar Link
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="hover:bg-primary/10 hover:border-primary"
                    >
                      <Code2 className="w-4 h-4 mr-2" />
                      Widget de Chat
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Widget de Chat Online</DialogTitle>
                    </DialogHeader>
                    <ChatWidgetGenerator 
                      botId={agentId} 
                      type="agent"
                    />
                  </DialogContent>
                </Dialog>
                <Button 
                  variant="outline" 
                  onClick={handleTestInNewTab}
                  className="hover:bg-primary/10 hover:border-primary"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Testar Bot
                </Button>
              </>
            )}
            <Button 
              onClick={handleSave} 
              className="bg-primary hover:bg-primary/90"
              disabled={isSaving || !selectedNiche || !agentName.trim()}
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "Salvando..." : agentId ? "Salvar Alterações" : "Salvar Agente"}
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Nome do Agente - Destaque */}
          <Card className="p-8 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <div className="max-w-2xl">
              <Label className="text-lg font-semibold mb-3 block">Nome do Agente IA</Label>
              <Input
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                placeholder="Digite o nome do seu agente IA..."
                className="text-2xl font-bold h-14 bg-background"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Escolha um nome que represente bem o seu agente de atendimento
              </p>
            </div>
          </Card>

          {!agentId ? (
            /* Seleção de Nicho - Criação inicial */
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Target className="w-6 h-6 text-primary" />
                Escolha o Nicho do seu Agente IA
              </h2>
              <p className="text-muted-foreground mb-6">
                Selecione o segmento do seu negócio para personalizar o agente com perguntas específicas
              </p>

              <div className="mb-6">
                <Input
                  placeholder="🔍 Pesquisar nichos..."
                  value={nicheSearch}
                  onChange={(e) => setNicheSearch(e.target.value)}
                  className="max-w-md"
                />
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {filteredNiches.map((niche) => {
                  const Icon = niche.icon;
                  return (
                    <Card
                      key={niche.id}
                      className={`p-4 cursor-pointer transition-all hover:shadow-lg ${
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
                </div>
              )}
            </Card>
          ) : (
            /* Tabs para agente já salvo - Treinar e Base de Conhecimento */
            <Tabs defaultValue="niche" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="niche" className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Nicho
                </TabsTrigger>
                <TabsTrigger value="personality" className="flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  Treinar Agente
                </TabsTrigger>
                <TabsTrigger value="knowledge" className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Base de Conhecimento
                </TabsTrigger>
              </TabsList>

              {/* Nicho */}
              <TabsContent value="niche" className="space-y-6">
                <Card className="p-6">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <Target className="w-6 h-6 text-primary" />
                    Nicho do Agente
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    Segmento do seu negócio
                  </p>

                  <div className="mb-6">
                    <Input
                      placeholder="🔍 Pesquisar nichos..."
                      value={nicheSearch}
                      onChange={(e) => setNicheSearch(e.target.value)}
                      className="max-w-md"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                    {filteredNiches.map((niche) => {
                      const Icon = niche.icon;
                      return (
                        <Card
                          key={niche.id}
                          className={`p-4 cursor-pointer transition-all hover:shadow-lg ${
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
                    </div>
                  )}
                </Card>
              </TabsContent>

              {/* Treinar Agente (Personalidade) */}
              <TabsContent value="personality" className="space-y-6">
                <Card className="p-6">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <Brain className="w-6 h-6 text-primary" />
                    Treinar a Personalidade do Agente
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
                        <span>Objetivo</span>
                        <span>Empático</span>
                      </div>
                    </div>

                    <div>
                      <Label className="mb-3 block">Mensagem de Boas-vindas</Label>
                      <Textarea
                        placeholder="Olá! Como posso ajudar você hoje?"
                        value={welcomeMessage}
                        onChange={(e) => setWelcomeMessage(e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>
                </Card>
              </TabsContent>

              {/* Base de Conhecimento */}
              <TabsContent value="knowledge" className="space-y-6">
                <Card className="p-6">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <BookOpen className="w-6 h-6 text-primary" />
                    Base de Conhecimento do Agente
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    Adicione informações detalhadas que o agente deve conhecer para responder melhor
                  </p>

                  <div>
                    <Label className="mb-3 block">Conhecimento Especializado</Label>
                    <Textarea
                      placeholder="Adicione aqui informações detalhadas sobre seus produtos, serviços, políticas, FAQs, etc. Quanto mais informação você fornecer, mais preciso será o agente."
                      value={knowledge}
                      onChange={(e) => setKnowledge(e.target.value)}
                      rows={15}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Dica: Forneça informações em formato de perguntas e respostas, listas ou parágrafos descritivos.
                    </p>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
    </>
  );
};

export default AIAgentBuilder;
