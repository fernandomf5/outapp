import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, Save, FolderOpen, Trash2, Edit3, ZoomIn, ZoomOut, RotateCcw, Brain, Sparkles, LayoutGrid, Move, Link2, Copy, ChevronDown, GitBranch, ArrowRight, Circle, TreePine, Unlink, ChevronRight, ChevronUp, Focus, Maximize2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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
  created_at: string;
  updated_at: string;
}

const THEMES = {
  default: {
    name: 'Padrão',
    colors: ['#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#3B82F6', '#EF4444', '#06B6D4', '#84CC16'],
    bg: '#1a1a2e',
    line: '#a78bfa',
  },
  ocean: { 
    name: 'Oceano', 
    colors: ['#0EA5E9', '#06B6D4', '#14B8A6', '#10B981', '#22C55E', '#38BDF8', '#0284C7', '#0891B2'],
    bg: '#0c1929',
    line: '#0EA5E9'
  },
  sunset: { 
    name: 'Pôr do Sol', 
    colors: ['#F97316', '#FB923C', '#FBBF24', '#F59E0B', '#EAB308', '#FCD34D', '#DC2626', '#EA580C'],
    bg: '#1f1410',
    line: '#F97316'
  },
  forest: { 
    name: 'Floresta', 
    colors: ['#22C55E', '#16A34A', '#15803D', '#84CC16', '#4ADE80', '#A3E635', '#059669', '#10B981'],
    bg: '#0f1f14',
    line: '#22C55E'
  },
  purple: { 
    name: 'Roxo', 
    colors: ['#A855F7', '#9333EA', '#7C3AED', '#C084FC', '#D946EF', '#E879F9', '#6366F1', '#8B5CF6'],
    bg: '#1a0f29',
    line: '#A855F7'
  },
  neon: { 
    name: 'Neon', 
    colors: ['#F0ABFC', '#22D3EE', '#A3E635', '#FACC15', '#FB7185', '#34D399', '#60A5FA', '#C084FC'],
    bg: '#0f0f23',
    line: '#22D3EE'
  },
  warm: { 
    name: 'Quente', 
    colors: ['#EF4444', '#F97316', '#F59E0B', '#FBBF24', '#EC4899', '#F43F5E', '#FB923C', '#FCD34D'],
    bg: '#1f1414',
    line: '#EF4444'
  },
  cool: { 
    name: 'Frio', 
    colors: ['#3B82F6', '#6366F1', '#8B5CF6', '#06B6D4', '#0EA5E9', '#14B8A6', '#0284C7', '#7C3AED'],
    bg: '#0f1421',
    line: '#3B82F6'
  },
};

const ICONS = [
  '🎯', '💡', '⭐', '🚀', '📌', '🔥', '💎', '🎨', '📊', '🔗', 
  '✨', '🏆', '📝', '🎪', '🌟', '💼', '📱', '💻', '🎬', '🎵',
  '📚', '🔧', '⚡', '🌈', '🎁', '❤️', '💰', '🔒', '📈', '🎉',
  '🧠', '💬', '📣', '🛠️', '🌍', '🏠', '✅', '❌', '⚠️', '💪',
  '🤝', '👍', '👎', '🔍', '📅', '⏰', '🎓', '🏅', '🥇', '🌱'
];

const CUSTOM_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#FBBF24', '#84CC16', '#22C55E',
  '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
  '#8B5CF6', '#A855F7', '#D946EF', '#EC4899', '#F43F5E', '#78716C',
  '#1E293B', '#334155', '#475569', '#64748B', '#94A3B8', '#FFFFFF'
];

type OrganizationType = 'radial' | 'horizontal' | 'vertical' | 'tree' | 'mindmap';

export const MindMapCreatorPanel = () => {
  const { user } = useAuth();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<MindMapNode[]>([]);
  const [currentTheme, setCurrentTheme] = useState<keyof typeof THEMES>('default');
  const [mapName, setMapName] = useState('');
  const [mapDescription, setMapDescription] = useState('');
  const [savedMaps, setSavedMaps] = useState<MindMap[]>([]);
  const [currentMapId, setCurrentMapId] = useState<string | null>(null);
  const [isLoadDialogOpen, setIsLoadDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<MindMapNode | null>(null);
  const [editText, setEditText] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editSize, setEditSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);

  useEffect(() => {
    fetchSavedMaps();
  }, [user]);

  const fetchSavedMaps = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('mind_maps')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });
    
    if (!error && data) {
      setSavedMaps(data.map(map => ({
        ...map,
        nodes: (map.nodes as any) || [],
      })));
    }
  };

  const getPresentationLink = () => {
    if (!currentMapId) return null;
    return `${window.location.origin}/mindmap/${currentMapId}`;
  };

  const copyPresentationLink = () => {
    const link = getPresentationLink();
    if (link) {
      navigator.clipboard.writeText(link);
      toast.success('Link copiado para a área de transferência!');
    } else {
      toast.error('Salve o mapa primeiro para gerar o link');
    }
  };

  const createRootNode = () => {
    const theme = THEMES[currentTheme];
    const newNode: MindMapNode = {
      id: `node-${Date.now()}`,
      text: 'Ideia Central',
      x: 500,
      y: 350,
      color: theme.colors[0],
      parentId: null,
      isRoot: true,
      icon: '🎯',
    };
    setNodes([newNode]);
  };

  const addNode = () => {
    const theme = THEMES[currentTheme];
    const newNode: MindMapNode = {
      id: `node-${Date.now()}`,
      text: 'Nova Ideia',
      x: 200 + Math.random() * 400,
      y: 100 + Math.random() * 300,
      color: theme.colors[nodes.length % theme.colors.length],
      parentId: null,
      isRoot: false,
    };
    setNodes([...nodes, newNode]);
    toast.success('Novo nó adicionado!');
  };

  const addChildNode = (parentId: string) => {
    const parent = nodes.find(n => n.id === parentId);
    if (!parent) return;

    const theme = THEMES[currentTheme];
    const childCount = nodes.filter(n => n.parentId === parentId).length;
    const angle = (childCount * 60 - 90) * (Math.PI / 180);
    const distance = 180;

    const newNode: MindMapNode = {
      id: `node-${Date.now()}`,
      text: 'Nova Ideia',
      x: parent.x + Math.cos(angle) * distance,
      y: parent.y + Math.sin(angle) * distance,
      color: theme.colors[(nodes.length) % theme.colors.length],
      parentId: parentId,
      isRoot: false,
    };

    setNodes([...nodes, newNode]);
    toast.success('Nó filho adicionado!');
  };

  const deleteNode = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node?.isRoot) {
      toast.error('Não é possível deletar o nó central');
      return;
    }

    const nodesToDelete = new Set<string>();
    const findChildren = (id: string) => {
      nodesToDelete.add(id);
      nodes.filter(n => n.parentId === id).forEach(child => findChildren(child.id));
    };
    findChildren(nodeId);

    setNodes(nodes.filter(n => !nodesToDelete.has(n.id)));
    toast.success('Nó removido');
  };

  const disconnectNode = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node || node.isRoot) {
      toast.error('Não é possível desconectar o nó central');
      return;
    }
    setNodes(nodes.map(n => 
      n.id === nodeId ? { ...n, parentId: null } : n
    ));
    toast.success('Nó desconectado!');
  };

  const toggleCollapse = (nodeId: string) => {
    setNodes(nodes.map(n => 
      n.id === nodeId ? { ...n, collapsed: !n.collapsed } : n
    ));
  };

  const getDirectChildCount = (nodeId: string): number => {
    return nodes.filter(n => n.parentId === nodeId).length;
  };

  const isNodeVisible = (node: MindMapNode): boolean => {
    if (!node.parentId) return true;
    const parent = nodes.find(n => n.id === node.parentId);
    if (!parent) return true;
    if (parent.collapsed) return false;
    return isNodeVisible(parent);
  };

  const openEditDialog = (node: MindMapNode) => {
    setEditingNode(node);
    setEditText(node.text);
    setEditDescription(node.description || '');
    setEditIcon(node.icon || '');
    setEditColor(node.color);
    setEditSize(node.size || 'medium');
    setIsEditDialogOpen(true);
  };

  const saveNodeEdit = () => {
    if (!editingNode) return;
    setNodes(nodes.map(n => 
      n.id === editingNode.id 
        ? { ...n, text: editText, description: editDescription, icon: editIcon, color: editColor, size: editSize } 
        : n
    ));
    setIsEditDialogOpen(false);
    setEditingNode(null);
  };

  const getNodeSizeClasses = (size: 'small' | 'medium' | 'large' | undefined, isRoot: boolean) => {
    const sizeConfig = {
      small: { minWidth: isRoot ? 'min-w-[100px]' : 'min-w-[80px]', padding: 'px-2 py-2', iconSize: 'text-sm', textSize: 'text-xs', descSize: 'text-[10px]' },
      medium: { minWidth: isRoot ? 'min-w-[140px]' : 'min-w-[100px]', padding: 'px-4 py-3', iconSize: 'text-xl', textSize: isRoot ? 'text-base' : 'text-sm', descSize: 'text-xs' },
      large: { minWidth: isRoot ? 'min-w-[200px]' : 'min-w-[160px]', padding: 'px-6 py-4', iconSize: 'text-3xl', textSize: isRoot ? 'text-lg' : 'text-base', descSize: 'text-sm' },
    };
    return sizeConfig[size || 'medium'];
  };

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (draggedNode) {
      const dx = (e.clientX - lastMousePos.x) / scale;
      const dy = (e.clientY - lastMousePos.y) / scale;
      setNodes(prev => prev.map(n => 
        n.id === draggedNode ? { ...n, x: n.x + dx, y: n.y + dy } : n
      ));
      setLastMousePos({ x: e.clientX, y: e.clientY });
    } else if (isPanning) {
      const dx = e.clientX - lastMousePos.x;
      const dy = e.clientY - lastMousePos.y;
      setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setLastMousePos({ x: e.clientX, y: e.clientY });
    }
  }, [draggedNode, isPanning, lastMousePos, scale]);

  const handlePointerUp = useCallback(() => {
    setDraggedNode(null);
    setIsPanning(false);
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent, nodeId?: string) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    
    if (nodeId) {
      if (connectingFrom) {
        if (connectingFrom !== nodeId) {
          setNodes(prev => prev.map(n => 
            n.id === nodeId ? { ...n, parentId: connectingFrom } : n
          ));
          toast.success('Nós conectados!');
        }
        setConnectingFrom(null);
      } else {
        setDraggedNode(nodeId);
      }
    } else {
      setIsPanning(true);
    }
    setLastMousePos({ x: e.clientX, y: e.clientY });
  }, [connectingFrom]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale(prev => Math.max(0.3, Math.min(2, prev + delta)));
  }, []);

  const startConnecting = (nodeId: string) => {
    setConnectingFrom(nodeId);
    toast.info('Clique em outro nó para conectar');
  };

  const saveMap = async () => {
    if (!user) {
      toast.error('Faça login para salvar');
      return;
    }
    if (!mapName) {
      toast.error('Digite um nome para o mapa');
      return;
    }

    const mapData = {
      user_id: user.id,
      name: mapName,
      description: mapDescription || null,
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify([])),
      theme: currentTheme,
      updated_at: new Date().toISOString(),
    };

    if (currentMapId) {
      const { error } = await supabase
        .from('mind_maps')
        .update(mapData)
        .eq('id', currentMapId);
      
      if (error) {
        toast.error('Erro ao atualizar');
      } else {
        toast.success('Mapa atualizado!');
        fetchSavedMaps();
      }
    } else {
      const { data, error } = await supabase
        .from('mind_maps')
        .insert([mapData])
        .select()
        .single();
      
      if (error) {
        toast.error('Erro ao salvar');
      } else {
        setCurrentMapId(data.id);
        toast.success('Mapa salvo!');
        fetchSavedMaps();
      }
    }
  };

  const loadMap = (map: MindMap) => {
    setNodes(map.nodes || []);
    setMapName(map.name);
    setMapDescription(map.description || '');
    setCurrentTheme((map.theme as keyof typeof THEMES) || 'default');
    setCurrentMapId(map.id);
    setIsLoadDialogOpen(false);
    setScale(1);
    setOffset({ x: 0, y: 0 });
    toast.success('Mapa carregado!');
  };

  const deleteMap = async (mapId: string) => {
    const { error } = await supabase
      .from('mind_maps')
      .delete()
      .eq('id', mapId);
    
    if (!error) {
      toast.success('Mapa deletado');
      fetchSavedMaps();
      if (currentMapId === mapId) {
        newMap();
      }
    }
  };

  const newMap = () => {
    setNodes([]);
    setMapName('');
    setMapDescription('');
    setCurrentMapId(null);
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  const changeTheme = (theme: keyof typeof THEMES) => {
    setCurrentTheme(theme);
    const themeColors = THEMES[theme].colors;
    setNodes(nodes.map((n, i) => ({
      ...n,
      color: themeColors[i % themeColors.length]
    })));
  };

  const centerView = () => {
    if (nodes.length === 0) {
      setOffset({ x: 0, y: 0 });
      setScale(1);
      return;
    }
    
    const canvasWidth = canvasRef.current?.clientWidth || 1000;
    const canvasHeight = canvasRef.current?.clientHeight || 700;
    
    const minX = Math.min(...nodes.map(n => n.x));
    const maxX = Math.max(...nodes.map(n => n.x));
    const minY = Math.min(...nodes.map(n => n.y));
    const maxY = Math.max(...nodes.map(n => n.y));
    
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    
    const newOffsetX = (canvasWidth / 2) - (centerX * scale);
    const newOffsetY = (canvasHeight / 2) - (centerY * scale);
    
    setOffset({ x: newOffsetX, y: newOffsetY });
    toast.success('Visualização centralizada!');
  };

  // Helper: Get all children of a node
  const getChildren = (parentId: string): MindMapNode[] => {
    return nodes.filter(n => n.parentId === parentId);
  };

  // Helper: Get all descendants count
  const getDescendantsCount = (nodeId: string): number => {
    const children = getChildren(nodeId);
    if (children.length === 0) return 1;
    return children.reduce((sum, child) => sum + getDescendantsCount(child.id), 0);
  };

  // Helper: Get node depth
  const getNodeDepth = (node: MindMapNode): number => {
    if (node.isRoot || !node.parentId) return 0;
    const parent = nodes.find(n => n.id === node.parentId);
    if (!parent) return 1;
    return getNodeDepth(parent) + 1;
  };

  const organizeRadial = () => {
    const root = nodes.find(n => n.isRoot);
    if (!root) {
      toast.error('Adicione um nó central primeiro');
      return;
    }

    const centerX = 500;
    const centerY = 350;
    const baseRadius = 180;
    const radiusIncrement = 150;

    const positionNode = (
      node: MindMapNode,
      startAngle: number,
      endAngle: number,
      depth: number
    ): MindMapNode[] => {
      const result: MindMapNode[] = [];
      const children = getChildren(node.id);
      
      if (node.isRoot) {
        result.push({ ...node, x: centerX, y: centerY });
      }

      if (children.length === 0) return result;

      const totalDescendants = children.reduce((sum, c) => sum + getDescendantsCount(c.id), 0);
      let currentAngle = startAngle;

      children.forEach(child => {
        const childDescendants = getDescendantsCount(child.id);
        const angleSpan = ((endAngle - startAngle) * childDescendants) / totalDescendants;
        const childAngle = currentAngle + angleSpan / 2;
        const radius = baseRadius + depth * radiusIncrement;

        result.push({
          ...child,
          x: centerX + Math.cos(childAngle) * radius,
          y: centerY + Math.sin(childAngle) * radius,
        });

        result.push(...positionNode(child, currentAngle, currentAngle + angleSpan, depth + 1));
        currentAngle += angleSpan;
      });

      return result;
    };

    const positioned = positionNode(root, 0, 2 * Math.PI, 1);
    const positionMap = new Map(positioned.map(n => [n.id, n]));
    
    setNodes(nodes.map(n => positionMap.get(n.id) || n));
    toast.success('Organização radial aplicada!');
  };

  const organizeHorizontal = () => {
    const root = nodes.find(n => n.isRoot);
    if (!root) {
      toast.error('Adicione um nó central primeiro');
      return;
    }

    const startX = 100;
    const centerY = 350;
    const horizontalSpacing = 220;
    const verticalSpacing = 80;

    const positionNode = (
      node: MindMapNode,
      x: number,
      yStart: number,
      yEnd: number
    ): MindMapNode[] => {
      const result: MindMapNode[] = [];
      const children = getChildren(node.id);
      const y = (yStart + yEnd) / 2;

      result.push({ ...node, x, y });

      if (children.length === 0) return result;

      const totalDescendants = children.reduce((sum, c) => sum + Math.max(1, getDescendantsCount(c.id)), 0);
      const totalHeight = totalDescendants * verticalSpacing;
      let currentY = y - totalHeight / 2;

      children.forEach(child => {
        const childDescendants = Math.max(1, getDescendantsCount(child.id));
        const childHeight = childDescendants * verticalSpacing;
        
        result.push(...positionNode(
          child,
          x + horizontalSpacing,
          currentY,
          currentY + childHeight
        ));
        
        currentY += childHeight;
      });

      return result;
    };

    const positioned = positionNode(root, startX, 50, 650);
    const positionMap = new Map(positioned.map(n => [n.id, n]));
    
    setNodes(nodes.map(n => positionMap.get(n.id) || n));
    toast.success('Organização horizontal aplicada!');
  };

  const organizeVertical = () => {
    const root = nodes.find(n => n.isRoot);
    if (!root) {
      toast.error('Adicione um nó central primeiro');
      return;
    }

    const centerX = 500;
    const startY = 80;
    const verticalSpacing = 120;
    const horizontalSpacing = 160;

    const getSubtreeWidth = (nodeId: string): number => {
      const children = getChildren(nodeId);
      if (children.length === 0) return 1;
      return children.reduce((sum, c) => sum + getSubtreeWidth(c.id), 0);
    };

    const positionNode = (
      node: MindMapNode,
      depth: number,
      xStart: number,
      xEnd: number
    ): MindMapNode[] => {
      const result: MindMapNode[] = [];
      const children = getChildren(node.id);
      const x = (xStart + xEnd) / 2;
      const y = startY + depth * verticalSpacing;

      result.push({ ...node, x, y });

      if (children.length === 0) return result;

      const totalWidth = children.reduce((sum, c) => sum + getSubtreeWidth(c.id), 0);
      const availableWidth = xEnd - xStart;
      let currentX = xStart;

      children.forEach(child => {
        const childWidth = getSubtreeWidth(child.id);
        const childSpan = (availableWidth * childWidth) / totalWidth;
        
        result.push(...positionNode(child, depth + 1, currentX, currentX + childSpan));
        currentX += childSpan;
      });

      return result;
    };

    const totalWidth = Math.max(nodes.length * horizontalSpacing, 800);
    const positioned = positionNode(root, 0, centerX - totalWidth / 2, centerX + totalWidth / 2);
    const positionMap = new Map(positioned.map(n => [n.id, n]));
    
    setNodes(nodes.map(n => positionMap.get(n.id) || n));
    toast.success('Organização vertical aplicada!');
  };

  const organizeTree = () => {
    const root = nodes.find(n => n.isRoot);
    if (!root) {
      toast.error('Adicione um nó central primeiro');
      return;
    }

    const centerX = 500;
    const startY = 80;
    const levelSpacing = 130;
    const minNodeSpacing = 140;

    const getSubtreeWidth = (nodeId: string): number => {
      const children = getChildren(nodeId);
      if (children.length === 0) return minNodeSpacing;
      return Math.max(
        minNodeSpacing,
        children.reduce((sum, c) => sum + getSubtreeWidth(c.id), 0)
      );
    };

    const positionNode = (
      node: MindMapNode,
      depth: number,
      leftBound: number
    ): { nodes: MindMapNode[], rightBound: number } => {
      const children = getChildren(node.id);
      const y = startY + depth * levelSpacing;

      if (children.length === 0) {
        return {
          nodes: [{ ...node, x: leftBound + minNodeSpacing / 2, y }],
          rightBound: leftBound + minNodeSpacing
        };
      }

      let currentLeft = leftBound;
      const childResults: MindMapNode[] = [];

      children.forEach(child => {
        const result = positionNode(child, depth + 1, currentLeft);
        childResults.push(...result.nodes);
        currentLeft = result.rightBound;
      });

      const firstChild = childResults.find(n => n.id === children[0].id);
      const lastChild = childResults.find(n => n.id === children[children.length - 1].id);
      const x = firstChild && lastChild ? (firstChild.x + lastChild.x) / 2 : leftBound + minNodeSpacing / 2;

      return {
        nodes: [{ ...node, x, y }, ...childResults],
        rightBound: currentLeft
      };
    };

    const result = positionNode(root, 0, centerX - getSubtreeWidth(root.id) / 2);
    const positionMap = new Map(result.nodes.map(n => [n.id, n]));
    
    setNodes(nodes.map(n => positionMap.get(n.id) || n));
    toast.success('Organização em árvore aplicada!');
  };

  const organizeMindMap = () => {
    const root = nodes.find(n => n.isRoot);
    if (!root) {
      toast.error('Adicione um nó central primeiro');
      return;
    }

    const centerX = 500;
    const centerY = 350;
    const horizontalSpacing = 200;
    const verticalSpacing = 70;

    const directChildren = getChildren(root.id);
    const leftChildren = directChildren.slice(0, Math.ceil(directChildren.length / 2));
    const rightChildren = directChildren.slice(Math.ceil(directChildren.length / 2));

    const getSubtreeHeight = (nodeId: string): number => {
      const children = getChildren(nodeId);
      if (children.length === 0) return verticalSpacing;
      return children.reduce((sum, c) => sum + getSubtreeHeight(c.id), 0);
    };

    const positionBranch = (
      node: MindMapNode,
      x: number,
      yStart: number,
      yEnd: number,
      direction: 'left' | 'right',
      depth: number
    ): MindMapNode[] => {
      const result: MindMapNode[] = [];
      const children = getChildren(node.id);
      const y = (yStart + yEnd) / 2;

      result.push({ ...node, x, y });

      if (children.length === 0) return result;

      const totalHeight = children.reduce((sum, c) => sum + getSubtreeHeight(c.id), 0);
      let currentY = y - totalHeight / 2;
      const nextX = direction === 'left' ? x - horizontalSpacing : x + horizontalSpacing;

      children.forEach(child => {
        const childHeight = getSubtreeHeight(child.id);
        result.push(...positionBranch(
          child,
          nextX,
          currentY,
          currentY + childHeight,
          direction,
          depth + 1
        ));
        currentY += childHeight;
      });

      return result;
    };

    const positioned: MindMapNode[] = [{ ...root, x: centerX, y: centerY }];

    // Position left branches
    const leftTotalHeight = leftChildren.reduce((sum, c) => sum + getSubtreeHeight(c.id), 0);
    let leftY = centerY - leftTotalHeight / 2;
    leftChildren.forEach(child => {
      const childHeight = getSubtreeHeight(child.id);
      positioned.push(...positionBranch(
        child,
        centerX - horizontalSpacing,
        leftY,
        leftY + childHeight,
        'left',
        1
      ));
      leftY += childHeight;
    });

    // Position right branches
    const rightTotalHeight = rightChildren.reduce((sum, c) => sum + getSubtreeHeight(c.id), 0);
    let rightY = centerY - rightTotalHeight / 2;
    rightChildren.forEach(child => {
      const childHeight = getSubtreeHeight(child.id);
      positioned.push(...positionBranch(
        child,
        centerX + horizontalSpacing,
        rightY,
        rightY + childHeight,
        'right',
        1
      ));
      rightY += childHeight;
    });

    const positionMap = new Map(positioned.map(n => [n.id, n]));
    setNodes(nodes.map(n => positionMap.get(n.id) || n));
    toast.success('Organização mapa mental aplicada!');
  };

  const applyOrganization = (type: OrganizationType) => {
    switch (type) {
      case 'radial':
        organizeRadial();
        break;
      case 'horizontal':
        organizeHorizontal();
        break;
      case 'vertical':
        organizeVertical();
        break;
      case 'tree':
        organizeTree();
        break;
      case 'mindmap':
        organizeMindMap();
        break;
    }
  };

  const theme = THEMES[currentTheme];

  const renderConnections = () => {
    return nodes.filter(n => n.parentId && isNodeVisible(n)).map(node => {
      const parent = nodes.find(p => p.id === node.parentId);
      if (!parent) return null;

      const x1 = parent.x;
      const y1 = parent.y;
      const x2 = node.x;
      const y2 = node.y;

      const dx = x2 - x1;
      const dy = y2 - y1;
      const cx1 = x1 + dx * 0.4;
      const cy1 = y1;
      const cx2 = x2 - dx * 0.4;
      const cy2 = y2;

      return (
        <g key={`conn-${node.id}`}>
          <path
            d={`M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`}
            stroke={theme.line}
            strokeWidth="4"
            fill="none"
            opacity="0.4"
          />
          <path
            d={`M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`}
            stroke={theme.line}
            strokeWidth="2"
            fill="none"
            opacity="0.8"
          />
          {/* Arrow */}
          <circle
            cx={x2}
            cy={y2}
            r="6"
            fill={theme.line}
            opacity="0.6"
          />
        </g>
      );
    });
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
              <p className="text-sm text-muted-foreground">Organize suas ideias visualmente</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <Dialog open={isLoadDialogOpen} onOpenChange={setIsLoadDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <FolderOpen className="w-4 h-4 mr-2" />
                  Meus Mapas ({savedMaps.length})
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <FolderOpen className="w-5 h-5" />
                    Meus Mapas Mentais
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {savedMaps.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Nenhum mapa mental salvo ainda</p>
                  ) : (
                    savedMaps.map((map) => (
                      <Card key={map.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold">{map.name}</h4>
                            {map.description && <p className="text-sm text-muted-foreground">{map.description}</p>}
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">{(map.nodes || []).length} nós</Badge>
                              <Badge variant="outline" className="text-xs">
                                Tema: {THEMES[map.theme as keyof typeof THEMES]?.name || 'Padrão'}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => loadMap(map)}>
                              <Edit3 className="w-4 h-4 mr-1" />
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
            <Button variant="outline" size="sm" onClick={newMap}>
              <Plus className="w-4 h-4 mr-2" />
              Novo
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Controls */}
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
            <Select value={currentTheme} onValueChange={(v) => changeTheme(v as keyof typeof THEMES)}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(THEMES).map(([key, t]) => (
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
            <Button onClick={createRootNode} size="sm" variant="outline" disabled={nodes.some(n => n.isRoot)}>
              <Sparkles className="w-4 h-4 mr-1" />
              Central
            </Button>
            <Button onClick={addNode} size="sm" className="bg-primary">
              <Plus className="w-4 h-4 mr-1" />
              Nó
            </Button>
            
            {/* Organization Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline">
                  <LayoutGrid className="w-4 h-4 mr-2" />
                  Organizar
                  <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => applyOrganization('radial')}>
                  <Circle className="w-4 h-4 mr-2" />
                  Radial (Circular)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => applyOrganization('horizontal')}>
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Horizontal
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => applyOrganization('vertical')}>
                  <GitBranch className="w-4 h-4 mr-2 rotate-180" />
                  Vertical
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => applyOrganization('tree')}>
                  <TreePine className="w-4 h-4 mr-2" />
                  Árvore
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => applyOrganization('mindmap')}>
                  <Brain className="w-4 h-4 mr-2" />
                  Mapa Mental
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button onClick={saveMap} size="sm" variant="secondary">
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
            
            {currentMapId && (
              <>
                <Button onClick={() => {
                  window.open(`/mindmap-editor/${currentMapId}`, '_blank');
                  // Sai do modo de edição no painel
                  setCurrentMapId(null);
                  setMapName('');
                  setMapDescription('');
                  setNodes([]);
                  setScale(1);
                  setOffset({ x: 0, y: 0 });
                }} size="sm" variant="outline" className="bg-blue-500/10 border-blue-500/30 text-blue-500 hover:bg-blue-500/20">
                  <Maximize2 className="w-4 h-4 mr-2" />
                  Editor Full
                </Button>
                <Button onClick={copyPresentationLink} size="sm" variant="outline" className="bg-green-500/10 border-green-500/30 text-green-500 hover:bg-green-500/20">
                  <Link2 className="w-4 h-4 mr-2" />
                  Link Apresentação
                  <Copy className="w-3 h-3 ml-1" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setScale(s => Math.max(0.3, s - 0.2))}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground w-12 text-center">{Math.round(scale * 100)}%</span>
          <Button variant="outline" size="sm" onClick={() => setScale(s => Math.min(2, s + 0.2))}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => { 
              const rootNode = nodes.find(n => n.isRoot);
              if (rootNode && canvasRef.current) {
                const rect = canvasRef.current.getBoundingClientRect();
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                setScale(1);
                setOffset({ x: centerX - rootNode.x, y: centerY - rootNode.y });
              } else {
                setScale(1); 
                setOffset({ x: 0, y: 0 }); 
              }
            }}
            title="Centralizar no nó central"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={centerView}
            title="Centralizar visualização"
          >
            <Focus className="h-4 w-4" />
          </Button>
          {connectingFrom && (
            <Badge variant="secondary" className="ml-2">
              🔗 Conectando... (clique em outro nó)
            </Badge>
          )}
        </div>

        {/* Canvas */}
        <div
          ref={canvasRef}
          className="relative w-full h-[700px] rounded-xl border-2 border-border overflow-hidden touch-none"
          style={{ 
            backgroundColor: theme.bg,
            cursor: isPanning ? 'grabbing' : draggedNode ? 'move' : 'grab',
          }}
          onPointerDown={(e) => {
            if (e.target === canvasRef.current || (e.target as HTMLElement).classList.contains('canvas-area')) {
              handlePointerDown(e);
            }
          }}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onWheel={handleWheel}
        >
          {/* Grid pattern */}
          <div 
            className="absolute inset-0 pointer-events-none canvas-area"
            style={{
              backgroundImage: `radial-gradient(circle, ${theme.line}33 1px, transparent 1px)`,
              backgroundSize: '30px 30px',
            }}
          />

          {/* Transform container */}
          <div
            className="absolute inset-0 canvas-area"
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
              transformOrigin: 'center center',
            }}
          >
            {/* SVG for connections */}
            <svg 
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ overflow: 'visible' }}
            >
              {renderConnections()}
            </svg>

            {/* Nodes */}
            {nodes.filter(node => isNodeVisible(node)).map(node => {
              const childCount = getDirectChildCount(node.id);
              const sizeClasses = getNodeSizeClasses(node.size, node.isRoot);
              return (
                <div
                  key={node.id}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-shadow duration-200 group ${
                    draggedNode === node.id ? 'z-50' : 'z-10'
                  } ${connectingFrom === node.id ? 'ring-4 ring-white ring-opacity-50' : ''}`}
                  style={{
                    left: node.x,
                    top: node.y,
                    touchAction: 'none',
                  }}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    handlePointerDown(e, node.id);
                  }}
                  onDoubleClick={() => openEditDialog(node)}
                >
                  {/* Node card */}
                  <div
                    className={`relative rounded-2xl shadow-lg cursor-move transition-all duration-200 hover:scale-105 ${sizeClasses.minWidth}`}
                    style={{
                      backgroundColor: node.color,
                      boxShadow: `0 4px 20px ${node.color}60, 0 0 40px ${node.color}30`,
                      border: connectingFrom === node.id ? '3px solid white' : '2px solid rgba(255,255,255,0.3)',
                    }}
                  >
                    <div className={`${sizeClasses.padding} text-center`}>
                      {node.icon && <span className={`${sizeClasses.iconSize} mb-1 block`}>{node.icon}</span>}
                      <p className={`text-white font-semibold ${sizeClasses.textSize}`}>
                        {node.text}
                      </p>
                      {node.description && (
                        <p 
                          className={`text-white/80 mt-1 ${sizeClasses.descSize} whitespace-pre-wrap break-words`}
                          style={{ maxWidth: '120px' }}
                        >
                          {node.description}
                        </p>
                      )}
                      {/* Collapse indicator */}
                      {childCount > 0 && node.collapsed && (
                        <span className="text-xs text-white/70 mt-1 block">
                          ({childCount} ocultos)
                        </span>
                      )}
                    </div>

                    {/* Collapse/Expand button - bottom center */}
                    {childCount > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCollapse(node.id);
                        }}
                        className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform z-20"
                        title={node.collapsed ? `Expandir (${childCount} itens)` : 'Recolher'}
                      >
                        {node.collapsed ? (
                          <ChevronRight className="h-4 w-4 text-gray-700" />
                        ) : (
                          <ChevronUp className="h-4 w-4 text-gray-700" />
                        )}
                      </button>
                    )}

                    {/* Action buttons */}
                    <div className="absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-20">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addChildNode(node.id);
                        }}
                        className="w-6 h-6 rounded-full bg-green-500 shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
                        title="Adicionar filho"
                      >
                        <Plus className="h-4 w-4 text-white" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startConnecting(node.id);
                        }}
                        className="w-6 h-6 rounded-full bg-blue-500 shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
                        title="Conectar a outro nó"
                      >
                        <Move className="h-3 w-3 text-white" />
                      </button>
                      {/* Disconnect button - only show if node has parent */}
                      {node.parentId && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            disconnectNode(node.id);
                          }}
                          className="w-6 h-6 rounded-full bg-orange-500 shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
                          title="Desconectar"
                        >
                          <Unlink className="h-3 w-3 text-white" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditDialog(node);
                        }}
                        className="w-6 h-6 rounded-full bg-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
                        title="Editar"
                      >
                        <Edit3 className="h-3 w-3 text-gray-700" />
                      </button>
                      {!node.isRoot && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNode(node.id);
                          }}
                          className="w-6 h-6 rounded-full bg-red-500 shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
                          title="Excluir"
                        >
                          <Trash2 className="h-3 w-3 text-white" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Empty state */}
          {nodes.length === 0 && (
            <div 
              className="absolute inset-0 flex items-center justify-center cursor-pointer z-50"
              onClick={(e) => {
                e.stopPropagation();
                createRootNode();
              }}
            >
              <div className="bg-card/90 backdrop-blur px-6 py-4 rounded-lg border border-border text-center pointer-events-none">
                <p className="text-muted-foreground mb-2">
                  Clique aqui para criar o nó central
                </p>
                <p className="text-xs text-muted-foreground">
                  Depois adicione mais nós e conecte-os
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <Badge variant="outline">🖱️ Arraste os nós</Badge>
          <Badge variant="outline">🔗 Clique no ícone azul para conectar</Badge>
          <Badge variant="outline">🔓 Ícone laranja desconecta</Badge>
          <Badge variant="outline">📂 Botão inferior expande/recolhe filhos</Badge>
          <Badge variant="outline">✏️ Duplo clique para editar</Badge>
          <Badge variant="outline">🔍 Scroll para zoom</Badge>
        </div>
      </CardContent>

      {/* Edit Node Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Nó</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Título</Label>
              <Input 
                value={editText} 
                onChange={(e) => setEditText(e.target.value)}
                placeholder="Digite o título do nó"
              />
            </div>
            <div>
              <Label>Descrição</Label>
              <textarea 
                value={editDescription} 
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Descrição adicional (opcional)"
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm min-h-[60px] resize-none"
              />
            </div>
            <div>
              <Label>Tamanho</Label>
              <div className="flex gap-2 mt-2">
                {(['small', 'medium', 'large'] as const).map(size => (
                  <button
                    key={size}
                    onClick={() => setEditSize(size)}
                    className={`flex-1 px-3 py-2 rounded-md border text-sm ${editSize === size ? 'border-primary bg-primary/10 text-primary' : 'border-border'}`}
                  >
                    {size === 'small' ? 'Pequeno' : size === 'medium' ? 'Médio' : 'Grande'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Ícone</Label>
              <div className="flex flex-wrap gap-1.5 mt-2 max-h-[120px] overflow-y-auto p-1">
                <button
                  onClick={() => setEditIcon('')}
                  className={`w-7 h-7 rounded border flex items-center justify-center ${!editIcon ? 'border-primary bg-primary/10' : 'border-border'}`}
                >
                  <span className="text-xs">∅</span>
                </button>
                {ICONS.map(icon => (
                  <button
                    key={icon}
                    onClick={() => setEditIcon(icon)}
                    className={`w-7 h-7 rounded border flex items-center justify-center text-base ${editIcon === icon ? 'border-primary bg-primary/10' : 'border-border'}`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Cor do Tema</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {THEMES[currentTheme].colors.map(color => (
                  <button
                    key={color}
                    onClick={() => setEditColor(color)}
                    className={`w-7 h-7 rounded-full ${editColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-background' : ''}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <div>
              <Label>Todas as Cores</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {CUSTOM_COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => setEditColor(color)}
                    className={`w-7 h-7 rounded-full ${editColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-background' : ''}`}
                    style={{ backgroundColor: color, border: color === '#FFFFFF' ? '1px solid #ccc' : 'none' }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={saveNodeEdit} className="flex-1">
                Salvar
              </Button>
              {editingNode && !editingNode.isRoot && (
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    deleteNode(editingNode.id);
                    setIsEditDialogOpen(false);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
