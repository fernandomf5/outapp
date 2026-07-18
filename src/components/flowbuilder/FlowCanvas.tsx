import { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  ConnectionMode,
  BackgroundVariant,
  MiniMap,
  useReactFlow,
  EdgeProps,
  getBezierPath,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { X } from 'lucide-react';
import MessageNode from './nodes/MessageNode';
import QuestionNode from './nodes/QuestionNode';
import ConditionNode from './nodes/ConditionNode';
import ActionNode from './nodes/ActionNode';
import TriggerNode from './nodes/TriggerNode';
import QuickReplyNode from './nodes/QuickReplyNode';
import TextNode from './nodes/TextNode';
import ButtonNode from './nodes/ButtonNode';
import AudioNode from './nodes/AudioNode';
import ImageNode from './nodes/ImageNode';
import VideoNode from './nodes/VideoNode';
import DocumentNode from './nodes/DocumentNode';
import HumanAgentNode from './nodes/HumanAgentNode';

// Custom Edge component with delete button
const CustomEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}: EdgeProps) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <path
        id={id}
        style={style}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />
      <foreignObject
        width={24}
        height={24}
        x={labelX - 12}
        y={labelY - 12}
        className="edge-delete-button"
        requiredExtensions="http://www.w3.org/1999/xhtml"
      >
        <div className="flex items-center justify-center w-full h-full">
          <button
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center shadow-lg transition-smooth cursor-pointer border-2 border-background"
            onClick={(event) => {
              event.stopPropagation();
              const deleteEvent = new CustomEvent('delete-edge', { detail: { id } });
              window.dispatchEvent(deleteEvent);
            }}
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </foreignObject>
    </>
  );
};

const nodeTypes = {
  trigger: TriggerNode,
  message: MessageNode,
  question: QuestionNode,
  condition: ConditionNode,
  action: ActionNode,
  quickReply: QuickReplyNode,
  text: TextNode,
  button: ButtonNode,
  audio: AudioNode,
  image: ImageNode,
  video: VideoNode,
  document: DocumentNode,
  humanAgent: HumanAgentNode,
  condition: ConditionNode,
  question: QuestionNode,
  action: ActionNode,
};

const edgeTypes = {
  default: CustomEdge,
};

interface FlowCanvasProps {
  initialNodes: Node[];
  initialEdges: Edge[];
  onNodesChange: (nodes: Node[]) => void;
  onEdgesChange: (edges: Edge[]) => void;
  onNodeClick: (node: Node) => void;
}

export const FlowCanvas = ({
  initialNodes,
  initialEdges,
  onNodesChange,
  onEdgesChange,
  onNodeClick,
}: FlowCanvasProps) => {
  const [nodes, setNodes, onNodesChangeInternal] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChangeInternal] = useEdgesState(initialEdges);
  const { project } = useReactFlow();
  const [isDragging, setIsDragging] = useState(false);

  // Handler para deletar edges
  useEffect(() => {
    const handleDeleteEdge = (event: CustomEvent) => {
      const { id } = event.detail;
      setEdges((eds) => eds.filter((edge) => edge.id !== id));
    };

    window.addEventListener('delete-edge' as any, handleDeleteEdge as EventListener);
    return () => {
      window.removeEventListener('delete-edge' as any, handleDeleteEdge as EventListener);
    };
  }, [setEdges]);

  // Sincroniza mudanças locais com o componente pai

  useEffect(() => {
    onEdgesChange(edges);
  }, [edges, onEdgesChange]);

  // Atualiza o canvas quando o pai mudar (ex: ao editar no painel de propriedades)
  useEffect(() => {
    if (!isDragging) {
      setNodes(initialNodes);
    }
  }, [initialNodes, setNodes, isDragging]);

  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdges = addEdge(
        {
          ...params,
          animated: true,
          type: 'default',
          style: { stroke: 'hsl(var(--primary))' },
        },
        edges
      );
      setEdges(newEdges);
    },
    [edges, setEdges]
  );

  const handleNodesChange = useCallback(
    (changes: any) => {
      onNodesChangeInternal(changes);
    },
    [onNodesChangeInternal]
  );

  const handleEdgesChange = useCallback(
    (changes: any) => {
      onEdgesChangeInternal(changes);
    },
    [onEdgesChangeInternal]
  );

  const handleNodeClick = useCallback(
    (_: any, node: Node) => {
      onNodeClick(node);
    },
    [onNodeClick]
  );

  const handleNodeDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleNodeDragStop = useCallback(() => {
    setIsDragging(false);
    onNodesChange(nodes);
  }, [nodes, onNodesChange]);

  // Suporte a arrastar e soltar blocos do Sidebar
  const handleDragOver = useCallback((event: any) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((event: any) => {
    event.preventDefault();
    const type = event.dataTransfer.getData('application/reactflow');
    if (!type) return;

    const bounds = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const position = project({ x: event.clientX - bounds.left, y: event.clientY - bounds.top });

    const defaultLabel =
      type === 'message' ? 'Digite sua mensagem...' :
      type === 'question' ? 'Faça uma pergunta...' :
      type === 'condition' ? 'Se {{variável}} == "valor"' :
      type === 'action' ? 'Executar ação' :
      type === 'quickReply' ? 'Escolha uma opção:' :
      type === 'text' ? 'Digite seu texto...' :
      type === 'button' ? 'Adicione seus botões' :
      type === 'audio' ? 'Adicione um áudio' :
      type === 'image' ? 'Adicione uma imagem' :
      type === 'video' ? 'Adicione um vídeo' :
      type === 'document' ? 'Adicione um documento' :
      type === 'humanAgent' ? 'Transferir para atendente humano' : 'Novo bloco';

    const newNode: Node = {
      id: Date.now().toString(),
      type: type as any,
      position,
      data: {
        label: defaultLabel,
        buttons: (type === 'quickReply' || type === 'button') ? [
          { text: 'Opção 1', id: Math.random().toString(36).substr(2, 9) }, 
          { text: 'Opção 2', id: Math.random().toString(36).substr(2, 9) }
        ] : undefined,
      },
    };

    setNodes((nds) => {
      const next = [...nds, newNode];
      onNodesChange(next);
      return next;
    });
  }, [project, setNodes]);

  return (
    <div className="w-full h-full bg-accent/5">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        onNodeDragStart={handleNodeDragStart}
        onNodeDragStop={handleNodeDragStop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        deleteKeyCode={["Delete", "Backspace"]}
        fitView
        className="bg-background"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={16} 
          size={1}
          className="bg-accent/5"
        />
        <Controls className="bg-card border border-border shadow-lg rounded-lg" />
        <MiniMap 
          className="bg-card border border-border shadow-lg rounded-lg"
          nodeColor={(node) => {
            switch (node.type) {
              case 'trigger': return 'hsl(var(--primary))';
              case 'message': return 'hsl(var(--chart-1))';
              case 'question': return 'hsl(var(--chart-2))';
              case 'condition': return 'hsl(var(--chart-3))';
              case 'action': return 'hsl(var(--chart-4))';
              case 'quickReply': return 'hsl(var(--chart-5))';
              default: return 'hsl(var(--muted))';
            }
          }}
        />
      </ReactFlow>
    </div>
  );
};
