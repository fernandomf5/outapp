import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Brain, ZoomIn, ZoomOut, RotateCcw, Save, Plus, Trash2, Link2, Unlink, ChevronRight, ChevronUp, Focus, Palette, ArrowLeft, ExternalLink, LayoutGrid, ChevronDown, Circle, ArrowRight, GitBranch, TreePine, Sparkles, Lock, Unlock, Move } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type OrganizationType = 'radial' | 'horizontal' | 'vertical' | 'tree' | 'mindmap';
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
  customWidth?: number;
  customHeight?: number;
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
  const [savedNodes, setSavedNodes] = useState<MindMapNode[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<MindMapNode | null>(null);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [currentTheme, setCurrentTheme] = useState('default');
  const [isLocked, setIsLocked] = useState(false);

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

    const mapNodes = (data.nodes as any) || [];
    setMap({ ...data, nodes: mapNodes });
    setNodes(mapNodes);
    setSavedNodes(JSON.parse(JSON.stringify(mapNodes)));
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
      setSavedNodes(JSON.parse(JSON.stringify(nodes)));
      toast.success('Salvo com sucesso!');
    }
  };

  const restoreToSaved = () => {
    if (savedNodes) {
      setNodes(JSON.parse(JSON.stringify(savedNodes)));
      toast.success('Organização restaurada!');
    } else {
      toast.error('Nenhuma versão salva disponível');
    }
  };

  const theme = THEMES[currentTheme as keyof typeof THEMES] || THEMES.default;

  const createRootNode = () => {
    if (nodes.some(n => n.isRoot)) {
      toast.error('Já existe um nó central');
      return;
    }
    const newNode: MindMapNode = {
      id: crypto.randomUUID(),
      text: 'Ideia Central',
      x: 500,
      y: 350,
      color: theme.colors[0],
      parentId: null,
      isRoot: true,
      icon: '🎯',
      size: 'medium',
    };
    setNodes(prev => [...prev, newNode]);
    toast.success('Nó central criado!');
  };

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

  const addIndependentNode = () => {
    const newNode: MindMapNode = {
      id: crypto.randomUUID(),
      text: 'Nó Solto',
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 200,
      color: theme.colors[nodes.length % theme.colors.length],
      parentId: null,
      isRoot: false,
      size: 'medium',
    };
    setNodes(prev => [...prev, newNode]);
    toast.success('Nó independente criado! Use "Conectar" para vinculá-lo.');
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

  const isNodeVisible = (node: MindMapNode, visited: Set<string> = new Set()): boolean => {
    if (!node.parentId) return true;
    if (visited.has(node.id)) return true; // Prevent infinite loop on cycles
    visited.add(node.id);
    const parent = nodes.find(n => n.id === node.parentId);
    if (!parent) return true;
    if (parent.collapsed) return false;
    return isNodeVisible(parent, visited);
  };

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (isLocked) return;
    e.preventDefault();
    setIsPanning(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  }, [isLocked]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (isLocked) return;
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
  }, [isPanning, draggedNode, lastMousePos, scale, isLocked]);

  const handlePointerUp = useCallback(() => {
    setIsPanning(false);
    setDraggedNode(null);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (isLocked) return;
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale(prev => Math.max(0.3, Math.min(3, prev + delta)));
  }, [isLocked]);

  const handleNodePointerDown = (e: React.PointerEvent, nodeId: string) => {
    e.stopPropagation();
    if (connectingFrom) {
      if (connectingFrom !== nodeId) {
        // Check for circular reference
        const wouldCreateCycle = (targetId: string, sourceId: string, nodesList: MindMapNode[]): boolean => {
          let current = nodesList.find(n => n.id === targetId);
          const visited = new Set<string>();
          while (current && current.parentId) {
            if (visited.has(current.id)) return true;
            if (current.parentId === sourceId) return true;
            visited.add(current.id);
            current = nodesList.find(n => n.id === current!.parentId);
          }
          return false;
        };
        
        setNodes(prev => {
          if (wouldCreateCycle(nodeId, connectingFrom, prev)) {
            toast.error('Conexão criaria um ciclo!');
            return prev;
          }
          return prev.map(n => n.id === connectingFrom ? { ...n, parentId: nodeId } : n);
        });
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
      {/* Header - Compacto */}
      <header className="flex items-center justify-between px-2 py-2 bg-black/30 backdrop-blur-sm border-b border-white/10 gap-1 flex-wrap">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => window.close()} className="text-white hover:bg-white/10 h-8 w-8">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="p-1.5 bg-primary/20 rounded-lg">
            <Brain className="w-4 h-4 text-primary" />
          </div>
          <span className="text-sm font-bold text-white truncate max-w-[120px] hidden sm:block">{map.name}</span>
        </div>
        
        <TooltipProvider delayDuration={200}>
          <div className="flex items-center gap-1 flex-wrap justify-center">
            {/* Tema */}
            <Select value={currentTheme} onValueChange={setCurrentTheme}>
              <SelectTrigger className="w-[100px] h-8 bg-white/10 border-white/20 text-white text-xs">
                <Palette className="w-3 h-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(THEMES).map(([key, t]) => (
                  <SelectItem key={key} value={key}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Adicionar - Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" className="h-8 bg-white/10 border-white/20 text-white hover:bg-white/20 text-xs px-2">
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar
                  <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={createRootNode} disabled={nodes.some(n => n.isRoot)}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Nó Central
                </DropdownMenuItem>
                <DropdownMenuItem onClick={addNode}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nó Filho
                </DropdownMenuItem>
                <DropdownMenuItem onClick={addIndependentNode}>
                  <Circle className="w-4 h-4 mr-2" />
                  Nó Independente
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Organizar - Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" className="h-8 bg-white/10 border-white/20 text-white hover:bg-white/20 text-xs px-2">
                  <LayoutGrid className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Organizar</span>
                  <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => applyOrganization('radial')}>
                  <Circle className="w-4 h-4 mr-2" />
                  Radial
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

            {/* Restaurar */}
            {savedNodes && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={restoreToSaved} size="icon" variant="outline" className="h-8 w-8 bg-orange-500/20 border-orange-500/30 text-orange-400 hover:bg-orange-500/30">
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Restaurar</TooltipContent>
              </Tooltip>
            )}
            
            {/* Separador visual */}
            <div className="w-px h-6 bg-white/20 mx-1 hidden sm:block" />
            
            {/* Lock/Unlock */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  onClick={() => setIsLocked(!isLocked)} 
                  size="icon" 
                  variant="outline" 
                  className={`h-8 w-8 ${isLocked ? 'bg-red-500/30 border-red-500/50 text-red-400' : 'bg-white/10 border-white/20 text-white'} hover:bg-white/20`}
                >
                  {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isLocked ? 'Desbloquear mapa' : 'Bloquear mapa'}</TooltipContent>
            </Tooltip>
            
            {/* Zoom controls */}
            <div className="flex items-center gap-0.5 bg-white/5 rounded-md p-0.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => setScale(s => Math.max(0.3, s - 0.2))} className="h-7 w-7 text-white hover:bg-white/20">
                    <ZoomOut className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Diminuir zoom</TooltipContent>
              </Tooltip>
              <span className="text-xs text-white/60 w-8 text-center">{Math.round(scale * 100)}%</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => setScale(s => Math.min(3, s + 0.2))} className="h-7 w-7 text-white hover:bg-white/20">
                    <ZoomIn className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Aumentar zoom</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => {
                    const rootNode = nodes.find(n => n.isRoot);
                    if (rootNode && canvasRef.current) {
                      const rect = canvasRef.current.getBoundingClientRect();
                      setScale(1);
                      setOffset({ x: rect.width / 2 - rootNode.x, y: rect.height / 2 - rootNode.y });
                    }
                  }} className="h-7 w-7 text-white hover:bg-white/20">
                    <Focus className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Centralizar</TooltipContent>
              </Tooltip>
            </div>
            
            {connectingFrom && (
              <Badge variant="secondary" className="text-xs h-6">🔗 Conectando...</Badge>
            )}
            
            {/* Salvar */}
            <Button onClick={saveMap} size="sm" className="h-8 bg-green-500 hover:bg-green-600 text-white text-xs px-3">
              <Save className="h-4 w-4 mr-1" /> 
              <span className="hidden sm:inline">Salvar</span>
            </Button>
            
            {/* Abrir externa */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={() => window.open(`/mindmap/${map.id}`, '_blank')} className="h-8 w-8 bg-white/10 border-white/20 text-white hover:bg-white/20">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Abrir apresentação</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </header>

      <div className="flex flex-1">
        {/* Canvas */}
        <div
          ref={canvasRef}
          className={`flex-1 relative overflow-hidden touch-none ${isLocked ? 'cursor-not-allowed' : ''}`}
          style={{ cursor: isLocked ? 'not-allowed' : isPanning ? 'grabbing' : draggedNode ? 'move' : 'grab' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onWheel={handleWheel}
        >
          {isLocked && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 bg-red-500/80 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1.5">
              <Lock className="w-3 h-3" /> Mapa Bloqueado
            </div>
          )}
          <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: `radial-gradient(circle, ${theme.line}33 1px, transparent 1px)`, backgroundSize: '30px 30px' }} />
          
          <div className="absolute inset-0" style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`, transformOrigin: 'center center' }}>
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
              {renderConnections()}
            </svg>

            {nodes.filter(node => isNodeVisible(node)).map(node => {
              const sizeClasses = getNodeSizeClasses(node.size, node.isRoot);
              const childCount = getDirectChildCount(node.id);
              const nodeWidth = node.customWidth ? `${node.customWidth}px` : undefined;
              const nodeMinWidth = node.customWidth ? undefined : sizeClasses.minWidth;
              return (
                <div
                  key={node.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2"
                  style={{ left: node.x, top: node.y, touchAction: 'none' }}
                  onPointerDown={(e) => handleNodePointerDown(e, node.id)}
                >
                  <div
                    className={`relative rounded-2xl shadow-lg ${nodeMinWidth || ''} ${selectedNode?.id === node.id ? 'ring-4 ring-white/50' : ''}`}
                    style={{ 
                      backgroundColor: node.color, 
                      boxShadow: `0 4px 20px ${node.color}60`, 
                      border: '2px solid rgba(255,255,255,0.3)',
                      width: nodeWidth,
                      minHeight: node.customHeight ? `${node.customHeight}px` : undefined
                    }}
                  >
                    <div className={`${sizeClasses.padding} text-center`}>
                      {node.icon && <span className={`${sizeClasses.iconSize} mb-1 block`}>{node.icon}</span>}
                      <p className={`text-white font-semibold ${sizeClasses.textSize}`}>{node.text}</p>
                      {node.description && <p className={`text-white/80 mt-1 ${sizeClasses.descSize} whitespace-pre-wrap break-words`}>{node.description}</p>}
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
              
              {/* Dimensões flexíveis */}
              <div className="border-t border-white/10 pt-3">
                <div className="flex items-center gap-2 mb-2">
                  <Move className="w-3 h-3 text-white/60" />
                  <Label className="text-white/80 text-xs">Dimensões Personalizadas</Label>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] text-white/50">Largura</span>
                      <span className="text-[10px] text-white/70">{selectedNode.customWidth || 'Auto'}px</span>
                    </div>
                    <Slider
                      value={[selectedNode.customWidth || 120]}
                      onValueChange={([v]) => updateNode(selectedNode.id, { customWidth: v })}
                      min={80}
                      max={400}
                      step={10}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] text-white/50">Altura mín.</span>
                      <span className="text-[10px] text-white/70">{selectedNode.customHeight || 'Auto'}px</span>
                    </div>
                    <Slider
                      value={[selectedNode.customHeight || 60]}
                      onValueChange={([v]) => updateNode(selectedNode.id, { customHeight: v })}
                      min={40}
                      max={300}
                      step={10}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="flex gap-1 flex-wrap">
                    <Button size="sm" variant="outline" onClick={() => updateNode(selectedNode.id, { customWidth: undefined, customHeight: undefined })} className="text-[10px] h-6 px-2 bg-white/10 border-white/20 text-white hover:bg-white/20">
                      Auto
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => updateNode(selectedNode.id, { customWidth: 100, customHeight: 60 })} className="text-[10px] h-6 px-2 bg-white/10 border-white/20 text-white hover:bg-white/20">
                      P
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => updateNode(selectedNode.id, { customWidth: 160, customHeight: 80 })} className="text-[10px] h-6 px-2 bg-white/10 border-white/20 text-white hover:bg-white/20">
                      M
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => updateNode(selectedNode.id, { customWidth: 220, customHeight: 100 })} className="text-[10px] h-6 px-2 bg-white/10 border-white/20 text-white hover:bg-white/20">
                      G
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => updateNode(selectedNode.id, { customWidth: 300, customHeight: 120 })} className="text-[10px] h-6 px-2 bg-white/10 border-white/20 text-white hover:bg-white/20">
                      XG
                    </Button>
                  </div>
                </div>
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
