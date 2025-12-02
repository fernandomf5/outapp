import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Brain, ZoomIn, ZoomOut, RotateCcw, Maximize, Minimize, ChevronRight, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

const getNodeSizeClasses = (size: 'small' | 'medium' | 'large' | undefined, isRoot: boolean) => {
  const sizeConfig = {
    small: { minWidth: isRoot ? 'min-w-[120px]' : 'min-w-[100px]', padding: 'px-3 py-3', iconSize: 'text-lg', textSize: 'text-sm', descSize: 'text-xs' },
    medium: { minWidth: isRoot ? 'min-w-[160px]' : 'min-w-[120px]', padding: 'px-5 py-4', iconSize: 'text-2xl', textSize: isRoot ? 'text-lg' : 'text-base', descSize: 'text-sm' },
    large: { minWidth: isRoot ? 'min-w-[220px]' : 'min-w-[180px]', padding: 'px-7 py-5', iconSize: 'text-4xl', textSize: isRoot ? 'text-xl' : 'text-lg', descSize: 'text-base' },
  };
  return sizeConfig[size || 'medium'];
};

interface MindMap {
  id: string;
  name: string;
  description: string;
  nodes: MindMapNode[];
  theme: string;
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

export default function MindMapPresentation() {
  const { id } = useParams();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<MindMap | null>(null);
  const [nodes, setNodes] = useState<MindMapNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    fetchMap();
  }, [id]);

  const fetchMap = async () => {
    if (!id) {
      setError('ID do mapa não fornecido');
      setLoading(false);
      return;
    }

    const { data, error: fetchError } = await supabase
      .from('mind_maps')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !data) {
      setError('Mapa mental não encontrado');
    } else {
      setMap({
        ...data,
        nodes: (data.nodes as any) || [],
      });
      setNodes((data.nodes as any) || []);
    }
    setLoading(false);
  };

  const getDirectChildCount = (nodeId: string): number => {
    return nodes.filter(n => n.parentId === nodeId).length;
  };

  const toggleCollapse = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNodes(prev => prev.map(n => 
      n.id === nodeId ? { ...n, collapsed: !n.collapsed } : n
    ));
  };

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    setIsPanning(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (isPanning) {
      const dx = e.clientX - lastMousePos.x;
      const dy = e.clientY - lastMousePos.y;
      setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setLastMousePos({ x: e.clientX, y: e.clientY });
    }
  }, [isPanning, lastMousePos]);

  const handlePointerUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale(prev => Math.max(0.3, Math.min(3, prev + delta)));
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Brain className="w-12 h-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando mapa mental...</p>
        </div>
      </div>
    );
  }

  if (error || !map) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Brain className="w-12 h-12 text-destructive mx-auto mb-4" />
          <p className="text-destructive">{error || 'Erro ao carregar'}</p>
        </div>
      </div>
    );
  }

  const theme = THEMES[map.theme as keyof typeof THEMES] || THEMES.default;

  const renderConnections = () => {
    return nodes.filter(n => n.parentId).map(node => {
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
          <circle cx={x2} cy={y2} r="6" fill={theme.line} opacity="0.6" />
        </g>
      );
    });
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: theme.bg }}>
      {/* Header */}
      <header className="flex items-center justify-between p-4 bg-black/30 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-xl">
            <Brain className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">{map.name}</h1>
            {map.description && (
              <p className="text-sm text-white/60">{map.description}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setScale(s => Math.max(0.3, s - 0.2))} className="bg-white/10 border-white/20 text-white hover:bg-white/20">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs text-white/60 w-12 text-center">{Math.round(scale * 100)}%</span>
          <Button variant="outline" size="sm" onClick={() => setScale(s => Math.min(3, s + 0.2))} className="bg-white/10 border-white/20 text-white hover:bg-white/20">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => { setScale(1); setOffset({ x: 0, y: 0 }); }}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={toggleFullscreen}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>
        </div>
      </header>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="flex-1 relative overflow-hidden touch-none"
        style={{ 
          cursor: isPanning ? 'grabbing' : 'grab',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
      >
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle, ${theme.line}33 1px, transparent 1px)`,
            backgroundSize: '30px 30px',
          }}
        />

        {/* Transform container */}
        <div
          className="absolute inset-0"
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
          {nodes.filter(node => {
            // Check if node is visible (not collapsed by parent)
            if (!node.parentId) return true;
            const parent = nodes.find(n => n.id === node.parentId);
            if (!parent) return true;
            if (parent.collapsed) return false;
            // Check recursively up the tree
            const checkParent = (parentNode: MindMapNode): boolean => {
              if (!parentNode.parentId) return true;
              const grandParent = nodes.find(n => n.id === parentNode.parentId);
              if (!grandParent) return true;
              if (grandParent.collapsed) return false;
              return checkParent(grandParent);
            };
            return checkParent(parent);
          }).map(node => {
            const sizeClasses = getNodeSizeClasses(node.size, node.isRoot);
            const childCount = getDirectChildCount(node.id);
            return (
              <div
                key={node.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: node.x,
                  top: node.y,
                }}
              >
                <div
                  className={`relative rounded-2xl shadow-lg ${sizeClasses.minWidth}`}
                  style={{
                    backgroundColor: node.color,
                    boxShadow: `0 4px 20px ${node.color}60, 0 0 40px ${node.color}30`,
                    border: '2px solid rgba(255,255,255,0.3)',
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
                  </div>
                  
                  {/* Collapse/Expand button */}
                  {childCount > 0 && (
                    <button
                      onClick={(e) => toggleCollapse(node.id, e)}
                      onPointerDown={(e) => e.stopPropagation()}
                      className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-6 h-6 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition-colors border border-white/30"
                      title={node.collapsed ? 'Expandir' : 'Recolher'}
                    >
                      {node.collapsed ? (
                        <ChevronRight className="w-4 h-4 text-white" />
                      ) : (
                        <ChevronUp className="w-4 h-4 text-white" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <footer className="p-3 bg-black/30 backdrop-blur-sm border-t border-white/10 text-center">
        <p className="text-xs text-white/40">
          {nodes.length} nós • Tema: {theme.name}
        </p>
      </footer>
    </div>
  );
}
