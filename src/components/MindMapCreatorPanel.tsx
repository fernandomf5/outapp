import { useState, useEffect, useCallback, useRef } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Connection,
  addEdge,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  NodeProps,
  MarkerType,
  Panel,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Plus,
  Save,
  Trash2,
  Edit,
  FolderOpen,
  Brain,
  Sparkles,
  LayoutGrid,
} from 'lucide-react';

// Temas predefinidos com lineColor para conexões
const themes = {
  default: {
    name: 'Padrão',
    colors: ['#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#3B82F6', '#EF4444'],
    background: '#1a1a2e',
    lineColor: '#a78bfa',
  },
  ocean: {
    name: 'Oceano',
    colors: ['#0EA5E9', '#06B6D4', '#14B8A6', '#22D3EE', '#38BDF8', '#67E8F9'],
    background: '#0c1929',
    lineColor: '#38bdf8',
  },
  forest: {
    name: 'Floresta',
    colors: ['#22C55E', '#16A34A', '#84CC16', '#4ADE80', '#A3E635', '#BEF264'],
    background: '#0f1f14',
    lineColor: '#4ade80',
  },
  sunset: {
    name: 'Pôr do Sol',
    colors: ['#F97316', '#FB923C', '#FBBF24', '#F59E0B', '#EAB308', '#FCD34D'],
    background: '#1f1410',
    lineColor: '#fbbf24',
  },
  purple: {
    name: 'Roxo',
    colors: ['#A855F7', '#8B5CF6', '#7C3AED', '#C084FC', '#D946EF', '#E879F9'],
    background: '#1a0f29',
    lineColor: '#c084fc',
  },
};

// Custom Mind Map Node Component - GitMind style
const MindMapNode = ({ data, selected }: NodeProps) => {
  const isRoot = data.isRoot;
  
  return (
    <div
      className={`
        relative px-5 py-3 rounded-2xl shadow-xl cursor-grab active:cursor-grabbing
        transition-all duration-200 border-2
        ${selected ? 'ring-4 ring-white/40 scale-105 shadow-2xl' : 'hover:scale-102 hover:shadow-2xl'}
        ${isRoot ? 'min-w-[180px] py-4' : 'min-w-[130px]'}
      `}
      style={{
        backgroundColor: data.color || '#8B5CF6',
        borderColor: selected ? '#fff' : 'rgba(255,255,255,0.2)',
        boxShadow: `0 8px 32px ${data.color}50`,
      }}
    >
      {/* Connection handles - all sides */}
      <Handle
        type="target"
        position={Position.Top}
        id="top-target"
        className="!w-4 !h-4 !bg-white !border-2 !border-white/50 hover:!scale-125 !transition-transform"
        style={{ top: -8 }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left-target"
        className="!w-4 !h-4 !bg-white !border-2 !border-white/50 hover:!scale-125 !transition-transform"
        style={{ left: -8 }}
      />
      
      {/* Node content */}
      <div className="text-center text-white font-medium select-none flex items-center justify-center gap-2">
        {data.icon && <span className="text-lg">{data.icon}</span>}
        <span className={isRoot ? 'text-lg font-bold' : 'text-sm'}>{data.label}</span>
      </div>
      
      {/* Source handles */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom-source"
        className="!w-4 !h-4 !bg-white !border-2 !border-white/50 hover:!scale-125 !transition-transform"
        style={{ bottom: -8 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right-source"
        className="!w-4 !h-4 !bg-white !border-2 !border-white/50 hover:!scale-125 !transition-transform"
        style={{ right: -8 }}
      />
    </div>
  );
};

const nodeTypes = {
  mindmap: MindMapNode,
};

interface MindMap {
  id: string;
  name: string;
  description: string | null;
  nodes: Node[];
  edges: Edge[];
  theme: string;
  created_at: string;
  updated_at: string;
}

export const MindMapCreatorPanel = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  
  const [mindMaps, setMindMaps] = useState<MindMap[]>([]);
  const [currentMap, setCurrentMap] = useState<MindMap | null>(null);
  const [mapName, setMapName] = useState('');
  const [mapDescription, setMapDescription] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<keyof typeof themes>('default');
  const [isListDialogOpen, setIsListDialogOpen] = useState(false);
  const [isNodeDialogOpen, setIsNodeDialogOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  
  // Node editing state
  const [nodeLabel, setNodeLabel] = useState('');
  const [nodeColor, setNodeColor] = useState('#8B5CF6');
  const [nodeIcon, setNodeIcon] = useState('');
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    fetchMindMaps();
  }, [user]);

  const fetchMindMaps = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('mind_maps')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (!error && data) {
      const formattedData = data.map((map: any) => ({
        ...map,
        nodes: Array.isArray(map.nodes) ? map.nodes : [],
        edges: Array.isArray(map.edges) ? map.edges : [],
      }));
      setMindMaps(formattedData);
    }
  };

  const onConnect = useCallback(
    (params: Connection) => {
      const theme = themes[selectedTheme];
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: 'smoothstep',
            animated: true,
            style: { 
              stroke: theme.lineColor, 
              strokeWidth: 3,
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: theme.lineColor,
              width: 20,
              height: 20,
            },
          },
          eds
        )
      );
    },
    [selectedTheme]
  );

  const addNode = (isRoot = false) => {
    const theme = themes[selectedTheme];
    const colorIndex = nodes.length % theme.colors.length;
    
    const centerX = 400;
    const centerY = 250;
    
    const newNode: Node = {
      id: isRoot ? `node-central-${Date.now()}` : `node-${Date.now()}`,
      type: 'mindmap',
      position: { 
        x: isRoot ? centerX : centerX + (nodes.length * 50) + Math.random() * 80, 
        y: isRoot ? centerY : centerY + (nodes.length * 30) + Math.random() * 60 
      },
      data: {
        label: isRoot ? 'Ideia Central' : 'Nova Ideia',
        color: isRoot ? theme.colors[0] : theme.colors[colorIndex],
        icon: isRoot ? '🎯' : '',
        isRoot,
      },
      draggable: true,
    };
    
    if (isRoot) {
      setNodes([newNode]);
      setEdges([]);
    } else {
      setNodes((nds) => [...nds, newNode]);
    }
  };

  const handleNodeClick = (event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setNodeLabel(node.data.label);
    setNodeColor(node.data.color || '#8B5CF6');
    setNodeIcon(node.data.icon || '');
    setIsNodeDialogOpen(true);
  };

  const updateNode = () => {
    if (!selectedNode) return;
    
    setNodes((nds) =>
      nds.map((node) =>
        node.id === selectedNode.id
          ? {
              ...node,
              data: {
                ...node.data,
                label: nodeLabel,
                color: nodeColor,
                icon: nodeIcon,
              },
            }
          : node
      )
    );
    
    setIsNodeDialogOpen(false);
    setSelectedNode(null);
  };

  const deleteSelectedNode = () => {
    if (!selectedNode) return;
    
    setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id));
    setEdges((eds) =>
      eds.filter(
        (edge) => edge.source !== selectedNode.id && edge.target !== selectedNode.id
      )
    );
    
    setIsNodeDialogOpen(false);
    setSelectedNode(null);
  };

  const saveMap = async () => {
    if (!user || !mapName) {
      toast({
        title: 'Erro',
        description: 'Digite um nome para o mapa',
        variant: 'destructive',
      });
      return;
    }

    // Convert nodes and edges to plain JSON objects
    const nodesJson = JSON.parse(JSON.stringify(nodes));
    const edgesJson = JSON.parse(JSON.stringify(edges));

    const mapData = {
      user_id: user.id,
      name: mapName,
      description: mapDescription || null,
      nodes: nodesJson,
      edges: edgesJson,
      theme: selectedTheme,
    };

    if (currentMap) {
      const { error } = await supabase
        .from('mind_maps')
        .update(mapData)
        .eq('id', currentMap.id);

      if (error) {
        toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Mapa atualizado!' });
        fetchMindMaps();
      }
    } else {
      const { error } = await supabase.from('mind_maps').insert(mapData);

      if (error) {
        toast({ title: 'Erro ao criar', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Mapa criado!' });
        fetchMindMaps();
      }
    }
  };

  const loadMap = (map: MindMap) => {
    setCurrentMap(map);
    setMapName(map.name);
    setMapDescription(map.description || '');
    setSelectedTheme(map.theme as keyof typeof themes || 'default');
    setNodes(map.nodes || []);
    setEdges(map.edges || []);
    setIsListDialogOpen(false);
  };

  const deleteMap = async (id: string) => {
    const { error } = await supabase.from('mind_maps').delete().eq('id', id);

    if (!error) {
      toast({ title: 'Mapa excluído' });
      fetchMindMaps();
      if (currentMap?.id === id) {
        newMap();
      }
    }
  };

  const newMap = () => {
    setCurrentMap(null);
    setMapName('');
    setMapDescription('');
    setNodes([]);
    setEdges([]);
    setSelectedTheme('default');
  };

  const exportAsImage = () => {
    toast({
      title: 'Exportando...',
      description: 'A funcionalidade de exportar está em desenvolvimento',
    });
  };

  const autoOrganize = () => {
    if (nodes.length === 0) return;

    const centerX = 400;
    const centerY = 300;
    const radius = 200;
    
    // Encontrar nó central (primeiro nó ou o que tem "central" no ID)
    const centralNodeIndex = nodes.findIndex((n) => n.id.includes('central'));
    const startIndex = centralNodeIndex >= 0 ? 0 : -1;
    
    const organizedNodes = nodes.map((node, index) => {
      if (index === centralNodeIndex || (centralNodeIndex < 0 && index === 0)) {
        return { ...node, position: { x: centerX, y: centerY } };
      }
      
      const adjustedIndex = centralNodeIndex >= 0 && index > centralNodeIndex ? index - 1 : index;
      const totalOther = centralNodeIndex >= 0 ? nodes.length - 1 : nodes.length - 1;
      const angle = (adjustedIndex / Math.max(totalOther, 1)) * 2 * Math.PI - Math.PI / 2;
      
      return {
        ...node,
        position: {
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
        },
      };
    });
    
    setNodes(organizedNodes);
    toast({ title: 'Nós organizados!' });
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Criador de Mapa Mental</CardTitle>
              <p className="text-sm text-muted-foreground">
                Organize suas ideias visualmente
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsListDialogOpen(true)}>
              <FolderOpen className="w-4 h-4 mr-2" />
              Meus Mapas ({mindMaps.length})
            </Button>
            <Button variant="outline" size="sm" onClick={newMap}>
              <Plus className="w-4 h-4 mr-2" />
              Novo
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Controles superiores */}
        <div className="flex flex-wrap gap-3 p-4 bg-muted/50 rounded-xl">
          <div className="flex-1 min-w-[200px]">
            <Label className="text-xs mb-1 block">Nome do Mapa</Label>
            <Input
              value={mapName}
              onChange={(e) => setMapName(e.target.value)}
              placeholder="Ex: Planejamento de Projeto"
              className="h-9"
            />
          </div>
          
          <div className="w-40">
            <Label className="text-xs mb-1 block">Tema</Label>
            <Select value={selectedTheme} onValueChange={(v) => setSelectedTheme(v as keyof typeof themes)}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(themes).map(([key, theme]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: theme.colors[0] }}
                      />
                      {theme.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-end gap-2 flex-wrap">
            <Button onClick={() => addNode(true)} size="sm" variant="outline">
              <Sparkles className="w-4 h-4 mr-1" />
              Ideia Central
            </Button>
            <Button onClick={() => addNode(false)} size="sm" className="bg-primary">
              <Plus className="w-4 h-4 mr-1" />
              Nó
            </Button>
            <Button onClick={autoOrganize} size="sm" variant="outline">
              <LayoutGrid className="w-4 h-4 mr-2" />
              Organizar
            </Button>
            <Button onClick={saveMap} size="sm" variant="secondary">
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
          </div>
        </div>

        {/* Canvas do Mapa Mental */}
        <div
          ref={reactFlowWrapper}
          className="h-[500px] rounded-xl overflow-hidden border-2 border-border"
          style={{ backgroundColor: themes[selectedTheme].background }}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={handleNodeClick}
            nodeTypes={nodeTypes}
            fitView
            snapToGrid
            snapGrid={[15, 15]}
            panOnDrag
            selectionOnDrag={false}
            zoomOnScroll
            zoomOnPinch
            panOnScroll={false}
            selectNodesOnDrag={false}
            nodesDraggable={true}
            nodesConnectable={true}
            elementsSelectable={true}
            defaultEdgeOptions={{
              type: 'smoothstep',
              animated: true,
              style: { stroke: themes[selectedTheme].lineColor, strokeWidth: 3 },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: themes[selectedTheme].lineColor,
                width: 20,
                height: 20,
              },
            }}
            connectionLineStyle={{ stroke: themes[selectedTheme].lineColor, strokeWidth: 2 }}
            proOptions={{ hideAttribution: true }}
          >
            <Background 
              color={themes[selectedTheme].lineColor} 
              gap={20} 
              size={1} 
              variant={BackgroundVariant.Dots}
            />
            <Controls 
              className="bg-card/90 backdrop-blur border border-border rounded-lg !shadow-lg"
              showZoom={true}
              showFitView={true}
              showInteractive={false}
            />
            <MiniMap
              className="!bg-card/90 !backdrop-blur !border !border-border !rounded-lg"
              nodeColor={(node) => node.data.color || themes[selectedTheme].colors[0]}
              maskColor="rgba(0,0,0,0.5)"
            />
            
            {/* Instructions Panel */}
            {nodes.length === 0 && (
              <Panel position="top-center" className="mt-4">
                <div className="bg-card/90 backdrop-blur px-4 py-3 rounded-lg border border-border text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    Comece clicando em <strong>"Ideia Central"</strong> para criar o nó principal
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Depois adicione nós e arraste das bolinhas brancas para conectar
                  </p>
                </div>
              </Panel>
            )}
          </ReactFlow>
        </div>

        {/* Dicas */}
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <Badge variant="outline">🖱️ Arraste os nós para mover</Badge>
          <Badge variant="outline">🔗 Arraste das bolinhas para conectar</Badge>
          <Badge variant="outline">✏️ Clique para editar</Badge>
          <Badge variant="outline">🔍 Scroll para zoom</Badge>
        </div>
      </CardContent>

      {/* Dialog para listar mapas salvos */}
      <Dialog open={isListDialogOpen} onOpenChange={setIsListDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5" />
              Meus Mapas Mentais
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {mindMaps.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum mapa mental salvo ainda
              </p>
            ) : (
              mindMaps.map((map) => (
                <Card key={map.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold">{map.name}</h4>
                      {map.description && (
                        <p className="text-sm text-muted-foreground">{map.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {(map.nodes || []).length} nós
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Tema: {themes[map.theme as keyof typeof themes]?.name || 'Padrão'}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => loadMap(map)}>
                        <Edit className="w-4 h-4 mr-1" />
                        Abrir
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => deleteMap(map.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para editar nó */}
      <Dialog open={isNodeDialogOpen} onOpenChange={setIsNodeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Nó</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Texto</Label>
              <Input
                value={nodeLabel}
                onChange={(e) => setNodeLabel(e.target.value)}
                placeholder="Digite o texto do nó"
              />
            </div>
            
            <div>
              <Label>Ícone (emoji)</Label>
              <Input
                value={nodeIcon}
                onChange={(e) => setNodeIcon(e.target.value)}
                placeholder="Ex: 💡 🎯 📝 🚀 ⭐"
              />
            </div>
            
            <div>
              <Label>Cor</Label>
              <div className="flex items-center gap-3 mt-2">
                <input
                  type="color"
                  value={nodeColor}
                  onChange={(e) => setNodeColor(e.target.value)}
                  className="w-12 h-10 rounded cursor-pointer border-0"
                />
                <div className="flex gap-1 flex-wrap">
                  {themes[selectedTheme].colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNodeColor(color)}
                      className={`w-8 h-8 rounded-full transition-all hover:scale-110 ${
                        nodeColor === color ? 'ring-2 ring-primary ring-offset-2' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button onClick={updateNode} className="flex-1">
                Salvar
              </Button>
              <Button variant="destructive" onClick={deleteSelectedNode}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
