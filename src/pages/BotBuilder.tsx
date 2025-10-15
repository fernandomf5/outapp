import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Save, Play, Link2, Copy, Power, Eye, EyeOff } from "lucide-react";
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

const BotBuilder = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const chatbotId = searchParams.get('id');
  const { saveChatbot, loadChatbot, toggleActive, isSaving, isLoading } = useChatbot();
  
  const [botName, setBotName] = useState("Novo Chatbot");
  const [isActive, setIsActive] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [nodes, setNodes] = useState<Node[]>([
    {
      id: '1',
      type: 'trigger',
      position: { x: 250, y: 50 },
      data: { label: 'Quando receber mensagem' },
    },
  ]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  // Carregar chatbot existente
  useEffect(() => {
    if (chatbotId && user) {
      loadChatbot(chatbotId).then(chatbot => {
        setBotName(chatbot.name);
        setIsActive(chatbot.is_active);
        const config = chatbot.config as any;
        if (config?.nodes) {
          setNodes(config.nodes);
        }
        if (config?.edges) {
          setEdges(config.edges);
        }
      }).catch(console.error);
    }
  }, [chatbotId, user]);

  const addNode = useCallback((type: string) => {
    const nodeTypeMap: Record<string, string> = {
      'message': 'message',
      'question': 'question',
      'condition': 'condition',
      'action': 'action',
      'quickReply': 'quickReply',
    };

    const defaultLabels: Record<string, string> = {
      'message': 'Digite sua mensagem...',
      'question': 'Faça uma pergunta...',
      'condition': 'Se {{variável}} == "valor"',
      'action': 'Executar ação',
      'quickReply': 'Escolha uma opção:',
    };

    const newNode: Node = {
      id: Date.now().toString(),
      type: nodeTypeMap[type] || 'message',
      position: { 
        x: 250 + Math.random() * 100, 
        y: 150 + nodes.length * 100 
      },
      data: { 
        label: defaultLabels[type] || 'Novo bloco',
        buttons: type === 'quickReply' ? ['Opção 1', 'Opção 2'] : undefined,
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

  const handleNodeClick = useCallback((node: Node) => {
    setSelectedNode(node);
  }, []);

  const handleSave = useCallback(async () => {
    if (!user) return;

    try {
      const chatbotData = {
        id: chatbotId || undefined,
        name: botName,
        description: `Chatbot com ${nodes.length} blocos`,
        config: {
          nodes,
          edges,
        },
        is_active: isActive,
        user_id: user.id,
      };

      const result = await saveChatbot(chatbotData);
      
      if (!chatbotId && result) {
        navigate(`/bot-builder?id=${result.id}`);
      }
    } catch (error) {
      console.error('Save error:', error);
    }
  }, [botName, nodes, edges, isActive, user, chatbotId, saveChatbot, navigate]);

  const handleTest = useCallback(() => {
    if (chatbotId) {
      const link = `${window.location.origin}/chat/${chatbotId}`;
      window.open(link, '_blank');
    } else {
      toast({
        title: "Salve primeiro! 💾",
        description: "Você precisa salvar o chatbot antes de testar.",
        variant: "destructive",
      });
    }
  }, [chatbotId, toast]);

  const handleCopyLink = useCallback(() => {
    if (!chatbotId) {
      toast({
        title: "Salve primeiro! 💾",
        description: "Você precisa salvar o chatbot antes de gerar o link.",
        variant: "destructive",
      });
      return;
    }

    const link = `${window.location.origin}/chat/${chatbotId}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copiado! 🔗",
      description: "O link do chatbot foi copiado para a área de transferência.",
    });
  }, [chatbotId, toast]);

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
              />
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant={showPreview ? "default" : "outline"}
                onClick={() => setShowPreview(!showPreview)}
                className={showPreview ? "" : "hover:bg-primary/10 hover:border-primary"}
              >
                {showPreview ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                {showPreview ? 'Ocultar Prévia' : 'Testar Prévia'}
              </Button>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card">
                <Label htmlFor="active-switch" className="cursor-pointer">
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
          <Sidebar onAddNode={addNode} />
          
          <main className="flex-1 relative">
            <FlowCanvas
              initialNodes={nodes}
              initialEdges={edges}
              onNodesChange={setNodes}
              onEdgesChange={setEdges}
              onNodeClick={handleNodeClick}
            />
          </main>

          {showPreview ? (
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
            />
          )}
        </div>
      </div>
    </ReactFlowProvider>
  );
};

export default BotBuilder;
