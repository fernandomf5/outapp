import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Brain, ZoomIn, ZoomOut, RotateCcw, Save, Plus, Trash2, Link2, Unlink, ChevronRight, ChevronUp, Focus, Palette, ArrowLeft, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface MindMapNode {
  id: string;
  text: string;
  description?: string;
  x: number;
  y: number;
  color: string;
  parentId: string | null;
  isRoot: boolean;
  icon?: string;
  collapsed?: boolean;
  size?: 'small' | 'medium' | 'large';
}

interface MindMap {
  id: string;
  name: string;
  description: string;
  nodes: MindMapNode[];
  theme: string;
}

const THEMES = {
  default: { name: 'Padrão', colors: ['#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#3B82F6', '#EF4444', '#06B6D4', '#84CC16'], bg: '#1a1a2e', line: '#a78bfa' },
  ocean: { name: 'Oceano', colors: ['#0EA5E9', '#06B6D4', '#14B8A6', '#10B981', '#22C55E', '#38BDF8', '#0284C7', '#0891B2'], bg: '#0c1929', line: '#0EA5E9' },
  sunset: { name: 'Pôr do Sol', colors: ['#F97316', '#FB923C', '#FBBF24', '#F59E0B', '#EAB308', '#FCD34D', '#DC2626', '#EA580C'], bg: '#1f1410', line: '#F97316' },
  forest: { name: 'Floresta', colors: ['#22C55E', '#16A34A', '#15803D', '#84CC16', '#4ADE80', '#A3E635', '#059669', '#10B981'], bg: '#0f1f14', line: '#22C55E' },
  purple: { name: 'Roxo', colors: ['#A855F7', '#9333EA', '#7C3AED', '#C084FC', '#D946EF', '#E879F9', '#6366F1', '#8B5CF6'], bg: '#1a0f29', line: '#A855F7' },
  neon: { name: 'Neon', colors: ['#F0ABFC', '#22D3EE', '#A3E635', '#FACC15', '#FB7185', '#34D399', '#60A5FA', '#C084FC'], bg: '#0f0f23', line: '#22D3EE' },
  warm: { name: 'Quente', colors: ['#EF4444', '#F97316', '#F59E0B', '#FBBF24', '#EC4899', '#F43F5E', '#FB923C', '#FCD34D'], bg: '#1f1414', line: '#EF4444' },
  cool: { name: 'Frio', colors: ['#3B82F6', '#6366F1', '#8B5CF6', '#06B6D4', '#0EA5E9', '#14B8A6', '#0284C7', '#7C3AED'], bg: '#0f1421', line: '#3B82F6' },
};

const ICONS = ['🎯', '💡', '⭐', '🚀', '📌', '🔥', '💎', '🎨', '📊', '🔗', '✨', '🏆', '📝', '🎪', '🌟', '💼', '📱', '💻', '🎬', '🎵', '📚', '🔧', '⚡', '🌈', '🎁', '❤️', '💰', '🔒', '📈', '🎉', '🧠', '💬', '📣', '🛠️', '🌍', '🏠', '✅', '❌', '⚠️', '💪', '🤝', '👍', '👎', '🔍', '📅', '⏰', '🎓', '🏅', '🥇', '🌱'];

const getNodeSizeClasses = (size: 'small' | 'medium' | 'large' | undefined, isRoot: boolean) => {
  const sizeConfig = {
    small: { minWidth: isRoot ? 'min-w-[120px]' : 'min-w-[100px]', padding: 'px-3 py-3', iconSize: 'text-lg', textSize: 'text-sm', descSize: 'text-xs' },
    medium: { minWidth: isRoot ? 'min-w-[160px]' : 'min-w-[120px]', padding: 'px-5 py-4', iconSize: 'text-2xl', textSize: isRoot ? 'text-lg' : 'text-base', descSize: 'text-sm' },
    large: { minWidth: isRoot ? 'min-w-[220px]' : 'min-w-[180px]', padding: 'px-7 py-5', iconSize: 'text-4xl', textSize: isRoot ? 'text-xl' : 'text-lg', descSize: 'text-base' },
  };
  return sizeConfig[size || 'medium'];
};

export default function MindMapFullEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canvasRef = useRef<HTMLDivElement>(null);
  
  const [map, setMap] = useState<MindMap | null>(null);
  const [nodes, setNodes] = useState<MindMapNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<MindMapNode | null>(null);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [currentTheme, setCurrentTheme] = useState('default');

  useEffect(() => {
    if (id) fetchMap();
  }, [id]);

  const fetchMap = async () => {
    const { data, error } = await supabase
      .from('mind_maps')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      toast.error('Mapa não encontrado');
      return;
    }

    setMap({ ...data, nodes: (data.nodes as any) || [] });
    setNodes((data.nodes as any) || []);
    setCurrentTheme(data.theme || 'default');
    setLoading(false);
    
    // Center on root node after loading
    setTimeout(() => {
      const rootNode = ((data.nodes as any) || []).find((n: MindMapNode) => n.isRoot);
      if (rootNode && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        setOffset({ x: rect.width / 2 - rootNode.x, y: rect.height / 2 - rootNode.y });
      }
    }, 100);
  };

  const saveMap = async () => {
    if (!map || !user) return;
    
    const { error } = await supabase
      .from('mind_maps')
      .update({ nodes: nodes as any, theme: currentTheme, updated_at: new Date().toISOString() })
      .eq('id', map.id);

    if (error) {
      toast.error('Erro ao salvar');
    } else {
      toast.success('Salvo com sucesso!');
    }
  };

  const theme = THEMES[currentTheme as keyof typeof THEMES] || THEMES.default;

  const addNode = () => {
    const parentNode = selectedNode || nodes.find(n => n.isRoot);
    const newNode: MindMapNode = {
      id: crypto.randomUUID(),
      text: 'Novo bloco',
      x: parentNode ? parentNode.x + 200 : 400,
      y: parentNode ? parentNode.y + (Math.random() - 0.5) * 100 : 300,
      color: theme.colors[nodes.length % theme.colors.length],
      parentId: parentNode?.id || null,
      isRoot: false,
      size: 'medium',
    };
    setNodes(prev => [...prev, newNode]);
  };

  const deleteNode = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node?.isRoot) {
      toast.error('Não é possível deletar o nó central');
      return;
    }
    setNodes(prev => prev.filter(n => n.id !== nodeId && n.parentId !== nodeId));
    if (selectedNode?.id === nodeId) setSelectedNode(null);
  };

  const updateNode = (nodeId: string, updates: Partial<MindMapNode>) => {
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, ...updates } : n));
    if (selectedNode?.id === nodeId) {
      setSelectedNode(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const toggleCollapse = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, collapsed: !n.collapsed } : n));
  };

  const disconnectNode = (nodeId: string) => {
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, parentId: null } : n));
    toast.success('Nó desconectado');
  };

  const getDirectChildCount = (nodeId: string): number => nodes.filter(n => n.parentId === nodeId).length;

  const isNodeVisible = (node: MindMapNode): boolean => {
    if (!node.parentId) return true;
    const parent = nodes.find(n => n.id === node.parentId);
    if (!parent) return true;
    if (parent.collapsed) return false;
    return isNodeVisible(parent);
  };

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    setIsPanning(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (draggedNode) {
      const dx = (e.clientX - lastMousePos.x) / scale;
      const dy = (e.clientY - lastMousePos.y) / scale;
      setNodes(prev => prev.map(n => n.id === draggedNode ? { ...n, x: n.x + dx, y: n.y + dy } : n));
      setLastMousePos({ x: e.clientX, y: e.clientY });
    } else if (isPanning) {
      const dx = e.clientX - lastMousePos.x;
      const dy = e.clientY - lastMousePos.y;
      setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setLastMousePos({ x: e.clientX, y: e.clientY });
    }
  }, [isPanning, draggedNode, lastMousePos, scale]);

  const handlePointerUp = useCallback(() => {
    setIsPanning(false);
    setDraggedNode(null);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale(prev => Math.max(0.3, Math.min(3, prev + delta)));
  }, []);

  const handleNodePointerDown = (e: React.PointerEvent, nodeId: string) => {
    e.stopPropagation();
    if (connectingFrom) {
      if (connectingFrom !== nodeId) {
        setNodes(prev => prev.map(n => n.id === connectingFrom ? { ...n, parentId: nodeId } : n));
        toast.success('Conexão criada!');
      }
      setConnectingFrom(null);
    } else {
      setDraggedNode(nodeId);
      setLastMousePos({ x: e.clientX, y: e.clientY });
      setSelectedNode(nodes.find(n => n.id === nodeId) || null);
    }
  };

  const renderConnections = () => {
    return nodes.filter(n => n.parentId && isNodeVisible(n)).map(node => {
      const parent = nodes.find(p => p.id === node.parentId);
      if (!parent) return null;
      const dx = node.x - parent.x;
      const cx1 = parent.x + dx * 0.4;
      const cx2 = node.x - dx * 0.4;
      return (
        <g key={`conn-${node.id}`}>
          <path d={`M ${parent.x} ${parent.y} C ${cx1} ${parent.y}, ${cx2} ${node.y}, ${node.x} ${node.y}`} stroke={theme.line} strokeWidth="4" fill="none" opacity="0.4" />
          <path d={`M ${parent.x} ${parent.y} C ${cx1} ${parent.y}, ${cx2} ${node.y}, ${node.x} ${node.y}`} stroke={theme.line} strokeWidth="2" fill="none" opacity="0.8" />
          <circle cx={node.x} cy={node.y} r="6" fill={theme.line} opacity="0.6" />
        </g>
      );
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.bg }}>
        <Brain className="w-12 h-12 text-primary animate-pulse" />
      </div>
    );
  }

  if (!map) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.bg }}>
        <p className="text-white">Mapa não encontrado</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: theme.bg }}>
      {/* Header */}
      <header className="flex items-center justify-between p-3 bg-black/30 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => window.close()} className="text-white hover:bg-white/10">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Fechar
          </Button>
          <div className="p-2 bg-primary/20 rounded-xl">
            <Brain className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white">{map.name}</h1>
            <p className="text-xs text-white/60">Editor em tela cheia</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={currentTheme} onValueChange={setCurrentTheme}>
            <SelectTrigger className="w-[130px] bg-white/10 border-white/20 text-white text-xs">
              <Palette className="w-3 h-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(THEMES).map(([key, t]) => (
                <SelectItem key={key} value={key}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" onClick={addNode} className="bg-white/10 border-white/20 text-white hover:bg-white/20">
            <Plus className="h-4 w-4 mr-1" /> Adicionar
          </Button>
          
          <Button variant="outline" size="sm" onClick={() => setScale(s => Math.max(0.3, s - 0.2))} className="bg-white/10 border-white/20 text-white hover:bg-white/20">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs text-white/60 w-10 text-center">{Math.round(scale * 100)}%</span>
          <Button variant="outline" size="sm" onClick={() => setScale(s => Math.min(3, s + 0.2))} className="bg-white/10 border-white/20 text-white hover:bg-white/20">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => {
            const rootNode = nodes.find(n => n.isRoot);
            if (rootNode && canvasRef.current) {
              const rect = canvasRef.current.getBoundingClientRect();
              setScale(1);
              setOffset({ x: rect.width / 2 - rootNode.x, y: rect.height / 2 - rootNode.y });
            }
          }} className="bg-white/10 border-white/20 text-white hover:bg-white/20" title="Centralizar">
            <Focus className="h-4 w-4" />
          </Button>
          
          {connectingFrom && (
            <Badge variant="secondary" className="text-xs">🔗 Conectando...</Badge>
          )}
          
          <Button onClick={saveMap} size="sm" className="bg-green-500 hover:bg-green-600 text-white">
            <Save className="h-4 w-4 mr-1" /> Salvar
          </Button>
          
          <Button variant="outline" size="sm" onClick={() => window.open(`/mindmap/${map.id}`, '_blank')} className="bg-white/10 border-white/20 text-white hover:bg-white/20">
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Canvas */}
        <div
          ref={canvasRef}
          className="flex-1 relative overflow-hidden touch-none"
          style={{ cursor: isPanning ? 'grabbing' : draggedNode ? 'move' : 'grab' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onWheel={handleWheel}
        >
          <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: `radial-gradient(circle, ${theme.line}33 1px, transparent 1px)`, backgroundSize: '30px 30px' }} />
          
          <div className="absolute inset-0" style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`, transformOrigin: 'center center' }}>
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
              {renderConnections()}
            </svg>

            {nodes.filter(node => isNodeVisible(node)).map(node => {
              const sizeClasses = getNodeSizeClasses(node.size, node.isRoot);
              const childCount = getDirectChildCount(node.id);
              return (
                <div
                  key={node.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2"
                  style={{ left: node.x, top: node.y, touchAction: 'none' }}
                  onPointerDown={(e) => handleNodePointerDown(e, node.id)}
                >
                  <div
                    className={`relative rounded-2xl shadow-lg ${sizeClasses.minWidth} ${selectedNode?.id === node.id ? 'ring-4 ring-white/50' : ''}`}
                    style={{ backgroundColor: node.color, boxShadow: `0 4px 20px ${node.color}60`, border: '2px solid rgba(255,255,255,0.3)' }}
                  >
                    <div className={`${sizeClasses.padding} text-center`}>
                      {node.icon && <span className={`${sizeClasses.iconSize} mb-1 block`}>{node.icon}</span>}
                      <p className={`text-white font-semibold ${sizeClasses.textSize}`}>{node.text}</p>
                      {node.description && <p className={`text-white/80 mt-1 ${sizeClasses.descSize} whitespace-pre-wrap break-words`} style={{ maxWidth: '120px' }}>{node.description}</p>}
                    </div>
                    {childCount > 0 && (
                      <button onClick={(e) => toggleCollapse(node.id, e)} onPointerDown={(e) => e.stopPropagation()} className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-6 h-6 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center border border-white/30">
                        {node.collapsed ? <ChevronRight className="w-4 h-4 text-white" /> : <ChevronUp className="w-4 h-4 text-white" />}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Side Panel */}
        {selectedNode && (
          <div className="w-72 bg-black/40 backdrop-blur-sm border-l border-white/10 p-4 overflow-y-auto">
            <h3 className="text-white font-semibold mb-4">Editar Bloco</h3>
            
            <div className="space-y-4">
              <div>
                <Label className="text-white/80 text-xs">Texto</Label>
                <Input value={selectedNode.text} onChange={(e) => updateNode(selectedNode.id, { text: e.target.value })} className="bg-white/10 border-white/20 text-white text-sm" />
              </div>
              
              <div>
                <Label className="text-white/80 text-xs">Descrição</Label>
                <Input value={selectedNode.description || ''} onChange={(e) => updateNode(selectedNode.id, { description: e.target.value })} className="bg-white/10 border-white/20 text-white text-sm" placeholder="Descrição opcional" />
              </div>
              
              <div>
                <Label className="text-white/80 text-xs">Tamanho</Label>
                <Select value={selectedNode.size || 'medium'} onValueChange={(v) => updateNode(selectedNode.id, { size: v as any })}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Pequeno</SelectItem>
                    <SelectItem value="medium">Médio</SelectItem>
                    <SelectItem value="large">Grande</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-white/80 text-xs">Ícone</Label>
                <div className="grid grid-cols-8 gap-1 mt-1 max-h-24 overflow-y-auto">
                  <button onClick={() => updateNode(selectedNode.id, { icon: undefined })} className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 text-xs text-white/60">✕</button>
                  {ICONS.map((icon) => (
                    <button key={icon} onClick={() => updateNode(selectedNode.id, { icon })} className={`w-6 h-6 rounded text-sm ${selectedNode.icon === icon ? 'bg-white/30' : 'bg-white/10 hover:bg-white/20'}`}>{icon}</button>
                  ))}
                </div>
              </div>
              
              <div>
                <Label className="text-white/80 text-xs">Cor</Label>
                <div className="grid grid-cols-8 gap-1 mt-1">
                  {theme.colors.map((color) => (
                    <button key={color} onClick={() => updateNode(selectedNode.id, { color })} className={`w-6 h-6 rounded ${selectedNode.color === color ? 'ring-2 ring-white' : ''}`} style={{ backgroundColor: color }} />
                  ))}
                </div>
              </div>
              
              <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
                <Button variant="outline" size="sm" onClick={() => setConnectingFrom(selectedNode.id)} className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20 text-xs">
                  <Link2 className="w-3 h-3 mr-1" /> Conectar
                </Button>
                {selectedNode.parentId && !selectedNode.isRoot && (
                  <Button variant="outline" size="sm" onClick={() => disconnectNode(selectedNode.id)} className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20 text-xs">
                    <Unlink className="w-3 h-3 mr-1" /> Desconectar
                  </Button>
                )}
                {!selectedNode.isRoot && (
                  <Button variant="destructive" size="sm" onClick={() => deleteNode(selectedNode.id)} className="w-full text-xs">
                    <Trash2 className="w-3 h-3 mr-1" /> Excluir
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
