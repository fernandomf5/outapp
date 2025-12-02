import { useState, useEffect, useCallback, useMemo } from 'react';
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
  ReactFlowProvider,
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

function MindMapNode({ data, selected }: NodeProps) {
  const isRoot = data.isRoot;
  
  return (
    <div
      style={{
        padding: isRoot ? '16px 24px' : '12px 20px',
        borderRadius: '16px',
        backgroundColor: data.color || '#8B5CF6',
        border: selected ? '3px solid white' : '2px solid rgba(255,255,255,0.3)',
        boxShadow: `0 8px 24px ${data.color}60`,
        minWidth: isRoot ? '160px' : '120px',
        cursor: 'grab',
        position: 'relative',
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ width: 14, height: 14, background: 'white', border: '2px solid #666', top: -7 }}
      />
      <Handle
        type="target"
        position={Position.Left}
        style={{ width: 14, height: 14, background: 'white', border: '2px solid #666', left: -7 }}
      />
      
      <div style={{ textAlign: 'center', color: 'white', fontWeight: isRoot ? 700 : 500, fontSize: isRoot ? '16px' : '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', userSelect: 'none' }}>
        {data.icon && <span>{data.icon}</span>}
        <span>{data.label}</span>
      </div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ width: 14, height: 14, background: 'white', border: '2px solid #666', bottom: -7 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{ width: 14, height: 14, background: 'white', border: '2px solid #666', right: -7 }}
      />
    </div>
  );
}

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
  return (
    <ReactFlowProvider>
      <MindMapCreatorContent />
    </ReactFlowProvider>
  );
};

const MindMapCreatorContent = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [mindMaps, setMindMaps] = useState<MindMap[]>([]);
  const [currentMap, setCurrentMap] = useState<MindMap | null>(null);
  const [mapName, setMapName] = useState('');
  const [mapDescription, setMapDescription] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<keyof typeof themes>('default');
  const [isListDialogOpen, setIsListDialogOpen] = useState(false);
  const [isNodeDialogOpen, setIsNodeDialogOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  
  const [nodeLabel, setNodeLabel] = useState('');
  const [nodeColor, setNodeColor] = useState('#8B5CF6');
  const [nodeIcon, setNodeIcon] = useState('');
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const nodeTypes = useMemo(() => ({ mindmap: MindMapNode }), []);

  useEffect(() => {
    if (user) fetchMindMaps();
  }, [user]);

  const fetchMindMaps = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('mind_maps')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (!error && data) {
      setMindMaps(data.map((map: any) => ({
        ...map,
        nodes: Array.isArray(map.nodes) ? map.nodes : [],
        edges: Array.isArray(map.edges) ? map.edges : [],
      })));
    }
  };

  const onConnect = useCallback((params: Connection) => {
    const theme = themes[selectedTheme];
    setEdges((eds) => addEdge({
      ...params,
      type: 'smoothstep',
      animated: true,
      style: { stroke: theme.lineColor, strokeWidth: 3 },
      markerEnd: { type: MarkerType.ArrowClosed, color: theme.lineColor, width: 20, height: 20 },
    }, eds));
  }, [selectedTheme, setEdges]);

  const addNode = useCallback((isRoot = false) => {
    const theme = themes[selectedTheme];
    const colorIndex = nodes.length % theme.colors.length;
    
    const newNode: Node = {
      id: `node-${Date.now()}`,
      type: 'mindmap',
      position: { x: isRoot ? 400 : 200 + Math.random() * 300, y: isRoot ? 250 : 150 + Math.random() * 200 },
      data: {
        label: isRoot ? 'Ideia Central' : 'Nova Ideia',
        color: isRoot ? theme.colors[0] : theme.colors[colorIndex],
        icon: isRoot ? '🎯' : '',
        isRoot,
      },
    };
    
    if (isRoot) {
      setNodes([newNode]);
      setEdges([]);
    } else {
      setNodes((nds) => [...nds, newNode]);
    }
  }, [selectedTheme, nodes.length, setNodes, setEdges]);

  const handleNodeDoubleClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setNodeLabel(node.data.label);
    setNodeColor(node.data.color || '#8B5CF6');
    setNodeIcon(node.data.icon || '');
    setIsNodeDialogOpen(true);
  }, []);

  const updateNode = () => {
    if (!selectedNode) return;
    setNodes((nds) => nds.map((node) =>
      node.id === selectedNode.id
        ? { ...node, data: { ...node.data, label: nodeLabel, color: nodeColor, icon: nodeIcon } }
        : node
    ));
    setIsNodeDialogOpen(false);
    setSelectedNode(null);
  };

  const deleteSelectedNode = () => {
    if (!selectedNode) return;
    setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id));
    setEdges((eds) => eds.filter((edge) => edge.source !== selectedNode.id && edge.target !== selectedNode.id));
    setIsNodeDialogOpen(false);
    setSelectedNode(null);
  };

  const saveMap = async () => {
    if (!user || !mapName) {
      toast({ title: 'Erro', description: 'Digite um nome para o mapa', variant: 'destructive' });
      return;
    }

    const mapData = {
      user_id: user.id,
      name: mapName,
      description: mapDescription || null,
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
      theme: selectedTheme,
    };

    if (currentMap) {
      const { error } = await supabase.from('mind_maps').update(mapData).eq('id', currentMap.id);
      if (error) toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
      else { toast({ title: 'Mapa atualizado!' }); fetchMindMaps(); }
    } else {
      const { error } = await supabase.from('mind_maps').insert(mapData);
      if (error) toast({ title: 'Erro ao criar', description: error.message, variant: 'destructive' });
      else { toast({ title: 'Mapa criado!' }); fetchMindMaps(); }
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
      if (currentMap?.id === id) newMap();
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

  const autoOrganize = () => {
    if (nodes.length === 0) return;
    const centerX = 400, centerY = 250, radius = 180;
    
    const organizedNodes = nodes.map((node) => {
      if (node.data.isRoot) return { ...node, position: { x: centerX, y: centerY } };
      const otherNodes = nodes.filter(n => !n.data.isRoot);
      const nodeIndex = otherNodes.findIndex(n => n.id === node.id);
      const angle = (nodeIndex / otherNodes.length) * 2 * Math.PI - Math.PI / 2;
      return { ...node, position: { x: centerX + radius * Math.cos(angle), y: centerY + radius * Math.sin(angle) } };
    });
    
    setNodes(organizedNodes);
    toast({ title: 'Nós organizados!' });
  };

  const theme = themes[selectedTheme];

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
              <p className="text-sm text-muted-foreground">Organize suas ideias visualmente</p>
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
        <div className="flex flex-wrap gap-3 p-4 bg-muted/50 rounded-xl">
          <div className="flex-1 min-w-[200px]">
            <Label className="text-xs mb-1 block">Nome do Mapa</Label>
            <Input value={mapName} onChange={(e) => setMapName(e.target.value)} placeholder="Ex: Planejamento de Projeto" className="h-9" />
          </div>
          
          <div className="w-40">
            <Label className="text-xs mb-1 block">Tema</Label>
            <Select value={selectedTheme} onValueChange={(v) => setSelectedTheme(v as keyof typeof themes)}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(themes).map(([key, t]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.colors[0] }} />
                      {t.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-end gap-2 flex-wrap">
            <Button onClick={() => addNode(true)} size="sm" variant="outline"><Sparkles className="w-4 h-4 mr-1" />Central</Button>
            <Button onClick={() => addNode(false)} size="sm" className="bg-primary"><Plus className="w-4 h-4 mr-1" />Nó</Button>
            <Button onClick={autoOrganize} size="sm" variant="outline"><LayoutGrid className="w-4 h-4 mr-2" />Organizar</Button>
            <Button onClick={saveMap} size="sm" variant="secondary"><Save className="w-4 h-4 mr-2" />Salvar</Button>
          </div>
        </div>

        <div className="rounded-xl overflow-hidden border-2 border-border" style={{ height: 500, backgroundColor: theme.background }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeDoubleClick={handleNodeDoubleClick}
            nodeTypes={nodeTypes}
            fitView
            defaultEdgeOptions={{
              type: 'smoothstep',
              animated: true,
              style: { stroke: theme.lineColor, strokeWidth: 3 },
              markerEnd: { type: MarkerType.ArrowClosed, color: theme.lineColor, width: 20, height: 20 },
            }}
            connectionLineStyle={{ stroke: theme.lineColor, strokeWidth: 2 }}
            proOptions={{ hideAttribution: true }}
          >
            <Background color={theme.lineColor} gap={20} size={1} variant={BackgroundVariant.Dots} />
            <Controls className="bg-card/90 backdrop-blur border border-border rounded-lg" showZoom showFitView showInteractive={false} />
            <MiniMap className="!bg-card/90 !backdrop-blur !border !border-border !rounded-lg" nodeColor={(node) => node.data.color || theme.colors[0]} maskColor="rgba(0,0,0,0.5)" />
            
            {nodes.length === 0 && (
              <Panel position="top-center" className="mt-4">
                <div className="bg-card/90 backdrop-blur px-4 py-3 rounded-lg border border-border text-center">
                  <p className="text-sm text-muted-foreground mb-2">Clique em <strong>"Central"</strong> para criar o nó principal</p>
                  <p className="text-xs text-muted-foreground">Arraste das bolinhas brancas para conectar os nós</p>
                </div>
              </Panel>
            )}
          </ReactFlow>
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <Badge variant="outline">🖱️ Arraste os nós</Badge>
          <Badge variant="outline">🔗 Arraste das bolinhas para conectar</Badge>
          <Badge variant="outline">✏️ Duplo clique para editar</Badge>
          <Badge variant="outline">🔍 Scroll para zoom</Badge>
        </div>
      </CardContent>

      <Dialog open={isListDialogOpen} onOpenChange={setIsListDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><FolderOpen className="w-5 h-5" />Meus Mapas Mentais</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {mindMaps.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhum mapa mental salvo ainda</p>
            ) : (
              mindMaps.map((map) => (
                <Card key={map.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold">{map.name}</h4>
                      {map.description && <p className="text-sm text-muted-foreground">{map.description}</p>}
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">{(map.nodes || []).length} nós</Badge>
                        <Badge variant="outline" className="text-xs">Tema: {themes[map.theme as keyof typeof themes]?.name || 'Padrão'}</Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => loadMap(map)}><Edit className="w-4 h-4 mr-1" />Abrir</Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteMap(map.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isNodeDialogOpen} onOpenChange={setIsNodeDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Nó</DialogTitle></DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Texto</Label>
              <Input value={nodeLabel} onChange={(e) => setNodeLabel(e.target.value)} placeholder="Digite o texto do nó" />
            </div>
            
            <div>
              <Label>Ícone (emoji)</Label>
              <Input value={nodeIcon} onChange={(e) => setNodeIcon(e.target.value)} placeholder="Ex: 💡 🎯 📝 🚀 ⭐" />
            </div>
            
            <div>
              <Label>Cor</Label>
              <div className="flex items-center gap-3 mt-2">
                <input type="color" value={nodeColor} onChange={(e) => setNodeColor(e.target.value)} className="w-12 h-10 rounded cursor-pointer border-0" />
                <div className="flex gap-1 flex-wrap">
                  {theme.colors.map((color) => (
                    <button key={color} onClick={() => setNodeColor(color)} className={`w-8 h-8 rounded-full transition-all hover:scale-110 ${nodeColor === color ? 'ring-2 ring-primary ring-offset-2' : ''}`} style={{ backgroundColor: color }} />
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button onClick={updateNode} className="flex-1">Salvar</Button>
              <Button variant="destructive" onClick={deleteSelectedNode}><Trash2 className="w-4 h-4" /></Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
