import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Save, Play, Link2, Copy, Power, Eye, EyeOff, Zap, MessageSquare, Plus, X, Code2 } from "lucide-react";
import { Node, Edge } from 'reactflow';
import { ReactFlowProvider } from 'reactflow';
import { FlowCanvas } from '@/components/flowbuilder/FlowCanvas';
import { Sidebar } from '@/components/flowbuilder/Sidebar';
import { PropertiesPanel } from '@/components/flowbuilder/PropertiesPanel';
import { ChatPreview } from '@/components/flowbuilder/ChatPreview';
import { useChatbot } from '@/hooks/useChatbot';
import { useAuth } from '@/contexts/AuthContext';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ChatWidgetGenerator } from '@/components/ChatWidgetGenerator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';

const BotBuilder = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const chatbotId = searchParams.get('id');
  const { saveChatbot, loadChatbot, toggleActive, isSaving, isLoading } = useChatbot();
  
  const [botName, setBotName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [initialMessage, setInitialMessage] = useState("Olá! Como posso ajudar você hoje?");
  const [initialButtons, setInitialButtons] = useState<string[]>([]);
  const [newInitialButton, setNewInitialButton] = useState("");
  const [attendantName, setAttendantName] = useState("Atendente");
  const [showFlowEditor, setShowFlowEditor] = useState(false);
  const [showNameInput, setShowNameInput] = useState(!chatbotId);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [accessType, setAccessType] = useState<'public' | 'private' | 'anonymous'>('public');

  // Carregar chatbot existente
  useEffect(() => {
    if (chatbotId && user) {
      loadChatbot(chatbotId).then(chatbot => {
        setBotName(chatbot.name);
        setIsActive(chatbot.is_active);
        const config = chatbot.config as any;
        if (config?.initialMessage) {
          setInitialMessage(config.initialMessage);
        }
        if (config?.initialButtons) {
          setInitialButtons(config.initialButtons);
        }
        if (config?.attendantName) {
          setAttendantName(config.attendantName);
        }
        if (config?.nodes) {
          setNodes(config.nodes);
        }
        if (config?.edges) {
          setEdges(config.edges);
        }
        setAccessType((chatbot as any).access_type || 'public');
      }).catch(console.error);
    }
  }, [chatbotId, user]);

  // Sincronização em tempo real (silenciosa)
  useEffect(() => {
    if (!chatbotId) return;

    console.log('🔄 Iniciando sincronização em tempo real para chatbot:', chatbotId);

    const channel = supabase
      .channel(`chatbot-changes-${chatbotId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chatbots',
          filter: `id=eq.${chatbotId}`
        },
        (payload) => {
          console.log('📡 Atualização em tempo real recebida:', payload);
          const chatbot = payload.new as any;
          
          setBotName(chatbot.name);
          setIsActive(chatbot.is_active);
          
          const config = chatbot.config as any;
          if (config?.initialMessage) {
            setInitialMessage(config.initialMessage);
          }
          if (config?.initialButtons) {
            setInitialButtons(config.initialButtons);
          }
          if (config?.attendantName) {
            setAttendantName(config.attendantName);
          }
          if (config?.nodes) {
            setNodes(config.nodes);
          }
          if (config?.edges) {
            setEdges(config.edges);
          }

          toast({
            title: "Fluxo atualizado! 🔄",
            description: "O chatbot foi atualizado em tempo real.",
          });
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 Desconectando sincronização em tempo real');
      supabase.removeChannel(channel);
    };
  }, [chatbotId, toast]);

  const addNode = useCallback((type: string) => {
    const defaultLabels: Record<string, string> = {
      'text': 'Digite seu texto...',
      'button': 'Adicione seus botões',
      'image': 'Adicione uma imagem',
      'video': 'Adicione um vídeo',
      'audio': 'Adicione um áudio',
      'document': 'Adicione um documento',
    };

    const newNode: Node = {
      id: Date.now().toString(),
      type: type,
      position: { 
        x: 250 + Math.random() * 100, 
        y: 150 + nodes.length * 100 
      },
      data: { 
        label: defaultLabels[type] || 'Novo bloco',
        buttons: type === 'button' ? ['Opção 1', 'Opção 2'] : undefined,
      },
    };
    
    setNodes([...nodes, newNode]);
    setSelectedNode(newNode);
  }, [nodes]);

  const deleteNode = useCallback((id: string) => {
    if (nodes.length <= 1) {
      toast({
        title: "Não é possível excluir",
        description: "Você precisa ter pelo menos um bloco no fluxo.",
        variant: "destructive",
      });
      return;
    }
    setNodes(nodes.filter(node => node.id !== id));
    setEdges(edges.filter(edge => edge.source !== id && edge.target !== id));
    setSelectedNode(null);
  }, [nodes, edges, toast]);

  const updateNode = useCallback((id: string, data: any) => {
    setNodes(nodes.map(node => 
      node.id === id ? { ...node, data: { ...node.data, ...data } } : node
    ));
  }, [nodes]);

  const duplicateNode = useCallback((node: Node) => {
    const duplicatedNode: Node = {
      ...node,
      id: Date.now().toString(),
      position: {
        x: node.position.x + 50,
        y: node.position.y + 50,
      },
      data: { ...node.data },
    };
    
    setNodes([...nodes, duplicatedNode]);
    setSelectedNode(duplicatedNode);
    
    toast({
      title: "Bloco duplicado! 📋",
      description: "O bloco foi duplicado com sucesso.",
    });
  }, [nodes, toast]);

  const handleNodeClick = useCallback((node: Node) => {
    setSelectedNode(node);
  }, []);

  const addInitialButton = useCallback(() => {
    if (newInitialButton.trim()) {
      setInitialButtons([...initialButtons, newInitialButton.trim()]);
      setNewInitialButton("");
    }
  }, [newInitialButton, initialButtons]);

  const removeInitialButton = useCallback((index: number) => {
    setInitialButtons(initialButtons.filter((_, i) => i !== index));
  }, [initialButtons]);

  const handleSave = useCallback(async () => {
    if (!user) return;

    try {
      const chatbotData = {
        id: chatbotId || undefined,
        name: botName,
        description: `Chatbot com ${nodes.length} blocos`,
        config: {
          initialMessage,
          initialButtons,
          attendantName,
          nodes,
          edges,
        },
        is_active: isActive,
        user_id: user.id,
        access_type: accessType,
      };

      const result = await saveChatbot(chatbotData);
      
      if (!chatbotId && result) {
        navigate(`/bot-builder?id=${result.id}`);
      }
    } catch (error) {
      console.error('Save error:', error);
    }
  }, [botName, nodes, edges, initialButtons, isActive, user, chatbotId, saveChatbot, navigate, initialMessage]);

  const handleTest = useCallback(() => {
    if (chatbotId) {
      const slug = (botName || '')
        .normalize('NFD').replace(/\p{Diacritic}/gu, '')
        .toLowerCase().trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
      const link = `${window.location.origin}/chat/${chatbotId}/${slug || 'bot'}`;
      window.open(link, '_blank');
    } else {
      toast({
        title: "Salve primeiro! 💾",
        description: "Você precisa salvar o chatbot antes de testar.",
        variant: "destructive",
      });
    }
  }, [chatbotId, botName, toast]);

  const handleCopyLink = useCallback(() => {
    if (!chatbotId) {
      toast({
        title: "Salve primeiro! 💾",
        description: "Você precisa salvar o chatbot antes de gerar o link.",
        variant: "destructive",
      });
      return;
    }

    const slug = (botName || '')
      .normalize('NFD').replace(/\p{Diacritic}/gu, '')
      .toLowerCase().trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

    const link = `${window.location.origin}/chat/${chatbotId}/${slug || 'bot'}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copiado! 🔗",
      description: "O link do chatbot foi copiado para a área de transferência.",
    });
  }, [chatbotId, botName, toast]);

  const handleToggleActive = useCallback(async (checked: boolean) => {
    if (!chatbotId) {
      toast({
        title: "Salve primeiro! 💾",
        description: "Você precisa salvar o chatbot antes de ativá-lo.",
        variant: "destructive",
      });
      return;
    }

    try {
      await toggleActive(chatbotId, checked);
      setIsActive(checked);
    } catch (error) {
      console.error('Toggle active error:', error);
    }
  }, [chatbotId, toggleActive, toast]);

  return (
    <ReactFlowProvider>
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background flex flex-col">
        {/* Header */}
        <header className="bg-card/95 backdrop-blur-sm border-b border-border px-6 py-5 shadow-md z-10">
          <div className="max-w-full flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate("/dashboard")}
                className="hover:bg-primary/10"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <Input
                value={botName}
                onChange={(e) => setBotName(e.target.value)}
                className="text-xl font-bold border-none bg-transparent max-w-xs focus-visible:ring-0"
                placeholder="Nome do seu chatbot"
              />
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant={showPreview ? "default" : "outline"}
                onClick={() => setShowPreview(!showPreview)}
                className={showPreview ? "" : "hover:bg-primary/10 hover:border-primary"}
              >
                {showPreview ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                {showPreview ? 'Desativar modo lado a lado' : 'Ativar modo lado a lado'}
              </Button>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card">
                <Label htmlFor="active-switch" className="">
                  <Power className="w-4 h-4" />
                </Label>
                <Switch
                  id="active-switch"
                  checked={isActive}
                  onCheckedChange={handleToggleActive}
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
                    disabled={!chatbotId}
                  >
                    <Code2 className="w-4 h-4 mr-2" />
                    Widget de Chat
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Widget de Chat Online</DialogTitle>
                  </DialogHeader>
                  {chatbotId && (
                    <ChatWidgetGenerator 
                      botId={chatbotId} 
                      type="chatbot"
                    />
                  )}
                </DialogContent>
              </Dialog>
              <Button 
                variant="outline" 
                onClick={handleTest}
                className="hover:bg-primary/10 hover:border-primary"
              >
                <Play className="w-4 h-4 mr-2" />
                Testar Bot
              </Button>
              <Button 
                onClick={handleSave} 
                className="bg-primary hover:bg-primary/90"
                disabled={isSaving}
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {showFlowEditor && <Sidebar onAddNode={addNode} />}
          
          <main className="flex-1 relative p-6 overflow-auto">
            {!showFlowEditor ? (
              <div className="max-w-2xl mx-auto space-y-6 mt-8">
                <Card className="p-6 border-primary/20">
                  <div className="space-y-4">
                    <Label className="text-lg font-semibold">Tipo de Acesso ao Chatbot</Label>
                    <Select value={accessType} onValueChange={(value: 'public' | 'private' | 'anonymous') => setAccessType(value)}>
                      <SelectTrigger className="w-full h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="anonymous">
                          <div className="flex flex-col items-start">
                            <span className="font-semibold">💬 Acesso Direto (Sem Cadastro)</span>
                            <span className="text-xs text-muted-foreground">Chat instantâneo sem login</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="public">
                          <div className="flex flex-col items-start">
                            <span className="font-semibold">🌐 Acesso Livre (Com Cadastro)</span>
                            <span className="text-xs text-muted-foreground">Qualquer pessoa pode se cadastrar e usar</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="private">
                          <div className="flex flex-col items-start">
                            <span className="font-semibold">🔒 Acesso Privado (Com Aprovação)</span>
                            <span className="text-xs text-muted-foreground">Requer aprovação para acessar</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      {accessType === 'anonymous' 
                        ? '⚡ Usuários entram direto no chat sem precisar se cadastrar ou fazer login'
                        : accessType === 'public' 
                          ? '✓ Usuários podem se cadastrar e usar o chatbot livremente'
                          : '🔐 Você precisará aprovar cada solicitação de acesso individualmente (ideal para produtos digitais)'}
                    </p>
                  </div>
                </Card>

                <Card className="p-8 border-2 border-primary/20 shadow-xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-primary/10 p-3 rounded-xl">
                      <MessageSquare className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xl text-primary">Mensagem Inicial da Conversa</h3>
                      <p className="text-sm text-muted-foreground">
                        Esta mensagem será exibida automaticamente assim que alguém acessar o link do seu chatbot.
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-foreground">
                        Digite a mensagem de boas-vindas:
                      </label>
                      <textarea
                        value={initialMessage}
                        onChange={(e) => setInitialMessage(e.target.value)}
                        className="w-full min-h-[150px] p-4 rounded-lg border-2 border-border bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                        placeholder="Exemplo: Olá! Seja bem-vindo ao nosso atendimento. Como posso ajudar você hoje?"
                      />
                      <p className="text-xs text-muted-foreground">
                        💡 Dica: Seja claro e amigável na sua mensagem de boas-vindas
                      </p>
                    </div>

                    <div className="space-y-3">
                      <label className="text-sm font-medium text-foreground">
                        Nome do Atendente:
                      </label>
                      <Input
                        value={attendantName}
                        onChange={(e) => setAttendantName(e.target.value)}
                        placeholder="Ex: Suporte, Vendedor, Maria..."
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">
                        💡 Este nome será exibido nas mensagens do bot
                      </p>
                    </div>

                    <div className="space-y-3">
                      <label className="text-sm font-medium text-foreground">
                        Botões para iniciar a conversa (opcional):
                      </label>
                      <div className="space-y-2">
                        {initialButtons.map((button, index) => (
                          <Card key={index} className="p-3 flex items-center justify-between bg-secondary/50">
                            <span className="text-sm font-medium">{button}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeInitialButton(index)}
                              className="h-8 w-8 hover:bg-destructive/10"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </Card>
                        ))}
                        <div className="flex gap-2">
                          <Input
                            value={newInitialButton}
                            onChange={(e) => setNewInitialButton(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addInitialButton();
                              }
                            }}
                            placeholder="Ex: Ver produtos, Falar com vendedor..."
                            className="flex-1"
                          />
                          <Button 
                            onClick={(e) => { e.preventDefault(); addInitialButton(); }} 
                            size="icon"
                            type="button"
                            className="bg-primary hover:bg-primary/90"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          💡 Adicione botões para facilitar o início da conversa
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
                
                <Button 
                  onClick={() => {
                    // Se já existem nodes salvos, apenas mostrar o fluxo editor
                    if (nodes.length > 0) {
                      setShowFlowEditor(true);
                      return;
                    }
                    
                    // Se não tem nodes, criar nó da mensagem inicial
                    const initialNode: Node = {
                      id: 'initial-message',
                      type: initialButtons.length > 0 ? 'button' : 'text',
                      position: { x: 250, y: 50 },
                      data: { 
                        label: initialMessage,
                        buttons: initialButtons.length > 0 ? initialButtons : undefined,
                        isInitial: true,
                      },
                    };
                    
                    setNodes([initialNode]);
                    setShowFlowEditor(true);
                  }}
                  size="lg"
                  className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold text-lg py-7 shadow-lg hover:shadow-xl transition-all"
                >
                  <Zap className="w-6 h-6 mr-2" />
                  Editar Fluxo
                </Button>
                
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Clique em "Editar Fluxo" para montar toda a conversa do seu chatbot
                  </p>
                </div>
              </div>
            ) : showNameInput ? (
              <div className="max-w-2xl mx-auto space-y-6 mt-8">
                <Card className="p-8 border-2 border-primary/20 shadow-xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-primary/10 p-3 rounded-xl">
                      <MessageSquare className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xl text-primary">Nome do Chatbot</h3>
                      <p className="text-sm text-muted-foreground">
                        Escolha um nome para identificar seu chatbot
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <Input
                      value={botName}
                      onChange={(e) => setBotName(e.target.value)}
                      className="text-lg p-4"
                      placeholder="Ex: Bot de Vendas, Atendimento 24h..."
                    />
                    <Button 
                      onClick={() => {
                        if (botName.trim()) {
                          setShowNameInput(false);
                        } else {
                          toast({
                            title: "Nome obrigatório",
                            description: "Por favor, insira um nome para o chatbot",
                            variant: "destructive",
                          });
                        }
                      }}
                      size="lg"
                      className="w-full bg-primary hover:bg-primary/90"
                    >
                      Continuar
                    </Button>
                  </div>
                </Card>
              </div>
            ) : (
              <FlowCanvas
                initialNodes={nodes}
                initialEdges={edges}
                onNodesChange={setNodes}
                onEdgesChange={setEdges}
                onNodeClick={handleNodeClick}
              />
            )}
          </main>

          {showFlowEditor && (showPreview ? (
            <aside className="w-96 border-l border-border bg-card/50 backdrop-blur-sm">
              <ChatPreview
                nodes={nodes}
                edges={edges}
                botName={botName}
              />
            </aside>
          ) : (
              <PropertiesPanel 
                selectedNode={selectedNode} 
                onUpdateNode={updateNode} 
                onDeleteNode={deleteNode}
                onDuplicateNode={duplicateNode}
              />
          ))}
        </div>
      </div>
    </ReactFlowProvider>
  );
};

export default BotBuilder;
