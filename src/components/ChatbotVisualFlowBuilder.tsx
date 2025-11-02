import { useState, useCallback, useEffect } from 'react';
import { Node, Edge, ReactFlowProvider } from 'reactflow';
import 'reactflow/dist/style.css';
import { FlowCanvas } from './flowbuilder/FlowCanvas';
import { Sidebar } from './flowbuilder/Sidebar';
import { PropertiesPanel } from './flowbuilder/PropertiesPanel';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from './ui/button';
import { Save, Play } from 'lucide-react';
import { ChatPreview } from './flowbuilder/ChatPreview';
import { Card } from './ui/card';

interface ChatbotVisualFlowBuilderProps {
  chatbotId: string;
}

export const ChatbotVisualFlowBuilder = ({ chatbotId }: ChatbotVisualFlowBuilderProps) => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();

  // Carregar flow do banco de dados
  useEffect(() => {
    loadFlow();
  }, [chatbotId]);

  const loadFlow = async () => {
    try {
      const { data, error } = await supabase
        .from('chatbots')
        .select('config')
        .eq('id', chatbotId)
        .single();

      if (error) throw error;

      const config = data?.config as any;
      if (config?.nodes && config?.edges) {
        setNodes(config.nodes);
        setEdges(config.edges);
      } else {
        // Criar node inicial se não existir
        const initialNode: Node = {
          id: 'initial-message',
          type: 'text',
          position: { x: 250, y: 50 },
          data: { 
            label: 'Olá! Bem-vindo ao nosso atendimento. Como posso ajudar você hoje?',
            keyword: 'iniciar',
          },
        };
        setNodes([initialNode]);
        setEdges([]);
      }
    } catch (error) {
      console.error('Error loading flow:', error);
      toast({
        title: 'Erro ao carregar fluxo',
        description: 'Não foi possível carregar o fluxo de conversação',
        variant: 'destructive',
      });
    }
  };

  const saveFlow = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('chatbots')
        .update({
          config: { nodes, edges } as any,
          updated_at: new Date().toISOString(),
        })
        .eq('id', chatbotId);

      if (error) throw error;

      toast({
        title: 'Fluxo salvo!',
        description: 'O fluxo de conversação foi salvo com sucesso',
      });
    } catch (error) {
      console.error('Error saving flow:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar o fluxo de conversação',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleNodesChange = useCallback((newNodes: Node[]) => {
    setNodes(newNodes);
  }, []);

  const handleEdgesChange = useCallback((newEdges: Edge[]) => {
    setEdges(newEdges);
  }, []);

  const handleNodeClick = useCallback((node: Node) => {
    setSelectedNode(node);
  }, []);

  const handleUpdateNode = useCallback((id: string, data: any) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          return { ...node, data: { ...node.data, ...data } };
        }
        return node;
      })
    );
  }, []);

  const handleDeleteNode = useCallback((id: string) => {
    if (id === 'initial-message') {
      toast({
        title: 'Não é possível excluir',
        description: 'A mensagem inicial não pode ser excluída',
        variant: 'destructive',
      });
      return;
    }

    setNodes((nds) => nds.filter((node) => node.id !== id));
    setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
    setSelectedNode(null);

    toast({
      title: 'Bloco excluído',
      description: 'O bloco foi removido do fluxo',
    });
  }, [toast]);

  const handleDuplicateNode = useCallback((node: Node) => {
    const newNode: Node = {
      ...node,
      id: Date.now().toString(),
      position: {
        x: node.position.x + 50,
        y: node.position.y + 50,
      },
    };
    setNodes((nds) => [...nds, newNode]);
    toast({
      title: 'Bloco duplicado',
      description: 'Um novo bloco foi criado',
    });
  }, [toast]);

  const handleAddNode = useCallback((type: string) => {
    const defaultLabel =
      type === 'text' ? 'Digite seu texto...' :
      type === 'image' ? 'Adicione uma imagem' :
      type === 'video' ? 'Adicione um vídeo' :
      type === 'audio' ? 'Adicione um áudio' :
      type === 'document' ? 'Adicione um documento' :
      type === 'button' ? 'Adicione seus botões' :
      type === 'humanAgent' ? 'Transferir para atendente humano' : 'Novo bloco';

    const newNode: Node = {
      id: Date.now().toString(),
      type: type as any,
      position: { x: 250 + nodes.length * 50, y: 150 + nodes.length * 50 },
      data: {
        label: defaultLabel,
        buttons: type === 'button' ? [] : undefined,
      },
    };

    setNodes((nds) => [...nds, newNode]);
    setSelectedNode(newNode);
  }, [nodes.length]);

  return (
    <Card className="p-0 overflow-hidden border-2">
      <div className="bg-card border-b px-4 py-3 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Editor Visual de Fluxo</h2>
          <p className="text-sm text-muted-foreground">
            Arraste blocos ou clique na barra lateral para criar seu fluxo de conversação
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowPreview(!showPreview)}
          >
            <Play className="w-4 h-4 mr-2" />
            {showPreview ? 'Fechar' : 'Testar'} Preview
          </Button>
          <Button onClick={saveFlow} disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Salvando...' : 'Salvar Fluxo'}
          </Button>
        </div>
      </div>

      <div className="flex" style={{ height: '700px' }}>
        <Sidebar onAddNode={handleAddNode} />
        
        <div className="flex-1 relative">
          <ReactFlowProvider>
            <FlowCanvas
              initialNodes={nodes}
              initialEdges={edges}
              onNodesChange={handleNodesChange}
              onEdgesChange={handleEdgesChange}
              onNodeClick={handleNodeClick}
            />
          </ReactFlowProvider>
        </div>

        <PropertiesPanel
          selectedNode={selectedNode}
          onUpdateNode={handleUpdateNode}
          onDeleteNode={handleDeleteNode}
          onDuplicateNode={handleDuplicateNode}
        />
      </div>

      {showPreview && (
        <div className="border-t bg-muted/30 p-4">
          <h3 className="font-semibold mb-3">Preview do Chat</h3>
          <ChatPreview nodes={nodes} edges={edges} botName="Preview" />
        </div>
      )}
    </Card>
  );
};
