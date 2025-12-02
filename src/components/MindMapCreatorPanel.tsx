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
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
  Download,
  FolderOpen,
  Palette,
  Image,
  Circle,
  Square,
  Hexagon,
  Star,
  Triangle,
  Brain,
  Sparkles,
  FileText,
  LayoutGrid,
} from 'lucide-react';

// Temas predefinidos
const themes = {
  default: {
    name: 'Padrão',
    colors: ['#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#3B82F6', '#EF4444'],
    background: '#1e1e2e',
  },
  ocean: {
    name: 'Oceano',
    colors: ['#0EA5E9', '#06B6D4', '#14B8A6', '#22D3EE', '#38BDF8', '#67E8F9'],
    background: '#0c1929',
  },
  forest: {
    name: 'Floresta',
    colors: ['#22C55E', '#16A34A', '#84CC16', '#4ADE80', '#A3E635', '#BEF264'],
    background: '#0f1f14',
  },
  sunset: {
    name: 'Pôr do Sol',
    colors: ['#F97316', '#FB923C', '#FBBF24', '#F59E0B', '#EAB308', '#FCD34D'],
    background: '#1f1410',
  },
  purple: {
    name: 'Roxo',
    colors: ['#A855F7', '#8B5CF6', '#7C3AED', '#C084FC', '#D946EF', '#E879F9'],
    background: '#1a0f29',
  },
};

// Formas dos nós
const nodeShapes = ['circle', 'rectangle', 'rounded', 'hexagon', 'diamond'];

// Componente de nó customizado
const MindMapNode = ({ data, selected }: NodeProps) => {
  const shapeStyles: Record<string, string> = {
    circle: 'rounded-full aspect-square',
    rectangle: 'rounded-none',
    rounded: 'rounded-xl',
    hexagon: 'clip-hexagon',
    diamond: 'rotate-45',
  };

  return (
    <div
      className={`relative p-4 min-w-[120px] max-w-[200px] shadow-lg transition-all duration-300 ${
        shapeStyles[data.shape || 'rounded']
      } ${selected ? 'ring-2 ring-primary ring-offset-2' : ''}`}
      style={{
        backgroundColor: data.color || '#8B5CF6',
        color: '#fff',
        transform: data.shape === 'diamond' ? 'rotate(45deg)' : 'none',
      }}
    >
      <Handle type="target" position={Position.Top} className="!bg-white !w-3 !h-3" />
      <Handle type="target" position={Position.Left} className="!bg-white !w-3 !h-3" />
      
      <div
        className="text-center font-semibold text-sm"
        style={{
          transform: data.shape === 'diamond' ? 'rotate(-45deg)' : 'none',
        }}
      >
        {data.icon && <span className="mr-1">{data.icon}</span>}
        {data.label}
      </div>
      
      <Handle type="source" position={Position.Bottom} className="!bg-white !w-3 !h-3" />
      <Handle type="source" position={Position.Right} className="!bg-white !w-3 !h-3" />
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
  const [nodeShape, setNodeShape] = useState('rounded');
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
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: 'smoothstep',
            animated: true,
            style: { stroke: themes[selectedTheme].colors[0], strokeWidth: 2 },
          },
          eds
        )
      );
    },
    [selectedTheme]
  );

  const addNode = () => {
    const theme = themes[selectedTheme];
    const colorIndex = nodes.length % theme.colors.length;
    
    const newNode: Node = {
      id: `node-${Date.now()}`,
      type: 'mindmap',
      position: { 
        x: Math.random() * 400 + 100, 
        y: Math.random() * 300 + 100 
      },
      data: {
        label: 'Nova Ideia',
        color: theme.colors[colorIndex],
        shape: 'rounded',
        icon: '',
      },
    };
    
    setNodes((nds) => [...nds, newNode]);
  };

  const addCentralNode = () => {
    const theme = themes[selectedTheme];
    
    const centralNode: Node = {
      id: `node-central-${Date.now()}`,
      type: 'mindmap',
      position: { x: 300, y: 200 },
      data: {
        label: 'Ideia Central',
        color: theme.colors[0],
        shape: 'circle',
        icon: '🧠',
      },
    };
    
    setNodes([centralNode]);
    setEdges([]);
  };

  const handleNodeClick = (event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setNodeLabel(node.data.label);
    setNodeColor(node.data.color || '#8B5CF6');
    setNodeShape(node.data.shape || 'rounded');
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
                shape: nodeShape,
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
          
          <div className="flex items-end gap-2">
            <Button onClick={addCentralNode} size="sm" variant="outline">
              <Sparkles className="w-4 h-4 mr-2" />
              Ideia Central
            </Button>
            <Button onClick={addNode} size="sm" className="bg-primary">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Nó
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
          className="h-[500px] rounded-xl overflow-hidden border border-border"
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
            defaultEdgeOptions={{
              type: 'smoothstep',
              animated: true,
              style: { stroke: themes[selectedTheme].colors[0], strokeWidth: 2 },
            }}
          >
            <Background color={themes[selectedTheme].colors[0]} gap={20} size={1} />
            <Controls className="bg-card border border-border rounded-lg" />
            <MiniMap
              className="bg-card border border-border rounded-lg"
              nodeColor={(node) => node.data.color || themes[selectedTheme].colors[0]}
            />
          </ReactFlow>
        </div>

        {/* Dicas */}
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <Badge variant="outline">Clique em um nó para editar</Badge>
          <Badge variant="outline">Arraste entre nós para conectar</Badge>
          <Badge variant="outline">Use scroll para zoom</Badge>
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
                placeholder="Ex: 💡 🎯 📝"
              />
            </div>
            
            <div>
              <Label>Cor</Label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="color"
                  value={nodeColor}
                  onChange={(e) => setNodeColor(e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer"
                />
                <div className="flex gap-1">
                  {themes[selectedTheme].colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNodeColor(color)}
                      className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${
                        nodeColor === color ? 'ring-2 ring-primary ring-offset-2' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            <div>
              <Label>Forma</Label>
              <Select value={nodeShape} onValueChange={setNodeShape}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rounded">
                    <div className="flex items-center gap-2">
                      <Square className="w-4 h-4" /> Arredondado
                    </div>
                  </SelectItem>
                  <SelectItem value="circle">
                    <div className="flex items-center gap-2">
                      <Circle className="w-4 h-4" /> Círculo
                    </div>
                  </SelectItem>
                  <SelectItem value="rectangle">
                    <div className="flex items-center gap-2">
                      <Square className="w-4 h-4" /> Retângulo
                    </div>
                  </SelectItem>
                  <SelectItem value="diamond">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4" /> Diamante
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={updateNode} className="flex-1">
                Salvar Alterações
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
