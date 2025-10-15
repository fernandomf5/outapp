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
} from 'reactflow';
import 'reactflow/dist/style.css';
import MessageNode from './nodes/MessageNode';
import QuestionNode from './nodes/QuestionNode';
import ConditionNode from './nodes/ConditionNode';
import ActionNode from './nodes/ActionNode';
import TriggerNode from './nodes/TriggerNode';
import QuickReplyNode from './nodes/QuickReplyNode';

const nodeTypes = {
  trigger: TriggerNode,
  message: MessageNode,
  question: QuestionNode,
  condition: ConditionNode,
  action: ActionNode,
  quickReply: QuickReplyNode,
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
      type === 'quickReply' ? 'Escolha uma opção:' : 'Novo bloco';

    const newNode: Node = {
      id: Date.now().toString(),
      type: type as any,
      position,
      data: {
        label: defaultLabel,
        buttons: type === 'quickReply' ? ['Opção 1', 'Opção 2'] : undefined,
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
          connectionMode={ConnectionMode.Loose}
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
