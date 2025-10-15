import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Play } from "lucide-react";
import { Node, Edge } from 'reactflow';
import { ReactFlowProvider } from 'reactflow';
import { FlowCanvas } from '@/components/flowbuilder/FlowCanvas';
import { Sidebar } from '@/components/flowbuilder/Sidebar';
import { PropertiesPanel } from '@/components/flowbuilder/PropertiesPanel';

const BotBuilder = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [botName, setBotName] = useState("Novo Chatbot");
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

  const handleSave = useCallback(() => {
    console.log('Saving bot:', { botName, nodes, edges });
    toast({
      title: "Chatbot salvo! 💾",
      description: "Suas alterações foram salvas com sucesso.",
    });
  }, [botName, nodes, edges, toast]);

  const handleTest = useCallback(() => {
    toast({
      title: "Teste iniciado! 🧪",
      description: "Abra o WhatsApp para testar seu chatbot.",
    });
  }, [toast]);

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
              >
                <Save className="w-4 h-4 mr-2" />
                Salvar
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

          <PropertiesPanel
            selectedNode={selectedNode}
            onUpdateNode={updateNode}
            onDeleteNode={deleteNode}
          />
        </div>
      </div>
    </ReactFlowProvider>
  );
};

export default BotBuilder;
