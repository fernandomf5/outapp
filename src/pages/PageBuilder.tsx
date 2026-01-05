import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { 
  Loader2, ArrowLeft, Save, Undo, Redo, Eye, EyeOff, 
  Smartphone, Tablet, Monitor, Settings2, Plus, ExternalLink,
  Code, Download, Layers, FileJson
} from "lucide-react";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { BuilderSidebar } from "@/components/page-builder/BuilderSidebar";
import { BuilderCanvas } from "@/components/page-builder/BuilderCanvas";
import { BuilderProperties } from "@/components/page-builder/BuilderProperties";
import { BuilderToolbar } from "@/components/page-builder/BuilderToolbar";
import { DragOverlayContent } from "@/components/page-builder/DragOverlayContent";

export interface BuilderElement {
  id: string;
  type: 'section' | 'row' | 'column' | 'heading' | 'text' | 'image' | 'video' | 'button' | 'spacer' | 'divider' | 'icon' | 'html' | 'form' | 'countdown' | 'testimonial' | 'pricing' | 'faq' | 'gallery' | 'map' | 'social';
  content: string;
  styles: Record<string, string>;
  settings: Record<string, any>;
  children?: BuilderElement[];
  parentId?: string;
}

export interface BuilderPage {
  id: string;
  name: string;
  slug: string;
  elements: BuilderElement[];
  settings: {
    title: string;
    description: string;
    favicon: string;
    ogImage: string;
    customCss: string;
    customJs: string;
    bodyClass: string;
    backgroundColor: string;
    fontFamily: string;
  };
}

export interface BuilderHistory {
  elements: BuilderElement[];
  timestamp: number;
}

const PageBuilder = () => {
  const { pageId } = useParams();
  const [searchParams] = useSearchParams();
  const clonedPageId = searchParams.get('cloned');
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState<BuilderPage | null>(null);
  const [elements, setElements] = useState<BuilderElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<BuilderElement | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [showProperties, setShowProperties] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<'elements' | 'layers' | 'pages'>('elements');
  
  // History for undo/redo
  const [history, setHistory] = useState<BuilderHistory[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Dialog states
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [pageName, setPageName] = useState("");
  const [pageSlug, setPageSlug] = useState("");

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    if (user) {
      if (pageId) {
        fetchPage();
      } else if (clonedPageId) {
        loadClonedPage();
      } else {
        initNewPage();
      }
    }
  }, [pageId, clonedPageId, user]);

  const fetchPage = async () => {
    try {
      const { data, error } = await supabase
        .from('builder_pages')
        .select('*')
        .eq('id', pageId)
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;

      const rawData = data as any;
      const pageData: BuilderPage = {
        id: rawData.id,
        name: rawData.name,
        slug: rawData.slug,
        elements: (rawData.elements as BuilderElement[]) || [],
        settings: (rawData.settings as BuilderPage['settings']) || getDefaultSettings()
      };

      setPage(pageData);
      setElements(pageData.elements);
      setPageName(pageData.name);
      setPageSlug(pageData.slug);
      
      // Initialize history
      setHistory([{ elements: pageData.elements, timestamp: Date.now() }]);
      setHistoryIndex(0);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar página",
        description: error.message,
        variant: "destructive"
      });
      navigate('/dashboard?tab=page-builder');
    } finally {
      setLoading(false);
    }
  };

  const loadClonedPage = async () => {
    try {
      const { data, error } = await supabase
        .from('cloned_pages')
        .select('*')
        .eq('id', clonedPageId)
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;

      // Convert cloned page HTML to builder elements
      const convertedElements = convertHtmlToElements(data.page_content || "");
      
      const pageData: BuilderPage = {
        id: '',
        name: `Edição de ${data.slug || 'Página Clonada'}`,
        slug: data.slug || '',
        elements: convertedElements,
        settings: getDefaultSettings()
      };

      setPage(pageData);
      setElements(convertedElements);
      setPageName(pageData.name);
      setPageSlug(pageData.slug);
      
      // Initialize history
      setHistory([{ elements: convertedElements, timestamp: Date.now() }]);
      setHistoryIndex(0);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar página clonada",
        description: error.message,
        variant: "destructive"
      });
      initNewPage();
    } finally {
      setLoading(false);
    }
  };

  const initNewPage = () => {
    const defaultElements: BuilderElement[] = [
      {
        id: `section-${Date.now()}`,
        type: 'section',
        content: '',
        styles: {
          padding: '60px 20px',
          backgroundColor: 'transparent',
          minHeight: '300px'
        },
        settings: {
          fullWidth: false,
          containerWidth: '1200px'
        },
        children: []
      }
    ];

    const pageData: BuilderPage = {
      id: '',
      name: 'Nova Página',
      slug: '',
      elements: defaultElements,
      settings: getDefaultSettings()
    };

    setPage(pageData);
    setElements(defaultElements);
    setPageName(pageData.name);
    
    // Initialize history
    setHistory([{ elements: defaultElements, timestamp: Date.now() }]);
    setHistoryIndex(0);
    setLoading(false);
  };

  const getDefaultSettings = (): BuilderPage['settings'] => ({
    title: 'Nova Página',
    description: '',
    favicon: '',
    ogImage: '',
    customCss: '',
    customJs: '',
    bodyClass: '',
    backgroundColor: '#ffffff',
    fontFamily: 'Inter, sans-serif'
  });

  const convertHtmlToElements = (html: string): BuilderElement[] => {
    // Create a section with the HTML content as a custom HTML element
    return [{
      id: `section-${Date.now()}`,
      type: 'section',
      content: '',
      styles: {
        padding: '0',
        backgroundColor: 'transparent'
      },
      settings: { fullWidth: true },
      children: [{
        id: `html-${Date.now()}`,
        type: 'html',
        content: html,
        styles: {},
        settings: {}
      }]
    }];
  };

  const addToHistory = useCallback((newElements: BuilderElement[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ elements: newElements, timestamp: Date.now() });
    
    // Limit history to 50 items
    if (newHistory.length > 50) {
      newHistory.shift();
    }
    
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setElements(history[newIndex].elements);
      setSelectedElement(null);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setElements(history[newIndex].elements);
      setSelectedElement(null);
    }
  }, [history, historyIndex]);

  const handleSave = async () => {
    if (!pageName.trim()) {
      setShowSaveDialog(true);
      return;
    }

    setSaving(true);
    try {
      const slug = pageSlug || generateSlug(pageName);
      
      const pageData = {
        user_id: user?.id,
        name: pageName,
        slug: slug,
        elements: elements as any,
        settings: (page?.settings || getDefaultSettings()) as any,
        is_published: false
      };

      if (page?.id) {
        const { error } = await supabase
          .from('builder_pages')
          .update(pageData as any)
          .eq('id', page.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('builder_pages')
          .insert(pageData as any)
          .select()
          .single();

        if (error) throw error;

        setPage(prev => prev ? { ...prev, id: data.id } : null);
        
        // Update URL to include pageId
        navigate(`/page-builder/${data.id}`, { replace: true });
      }

      toast({ title: "Página salva com sucesso!" });
      setShowSaveDialog(false);
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeType = active.data.current?.type;
    const isNewElement = active.data.current?.isNew;

    if (isNewElement && activeType) {
      // Adding new element
      const newElement = createNewElement(activeType, over.id as string);
      const updatedElements = addElementToTree(elements, over.id as string, newElement);
      setElements(updatedElements);
      addToHistory(updatedElements);
      setSelectedElement(newElement);
    } else if (active.id !== over.id) {
      // Reordering elements
      const updatedElements = moveElement(elements, active.id as string, over.id as string);
      setElements(updatedElements);
      addToHistory(updatedElements);
    }
  };

  const createNewElement = (type: BuilderElement['type'], parentId?: string): BuilderElement => {
    const id = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const defaults: Record<string, Partial<BuilderElement>> = {
      section: {
        content: '',
        styles: { padding: '60px 20px', backgroundColor: 'transparent', minHeight: '200px' },
        settings: { fullWidth: false, containerWidth: '1200px' },
        children: []
      },
      row: {
        content: '',
        styles: { display: 'flex', flexWrap: 'wrap', gap: '20px', padding: '20px 0' },
        settings: { columns: 2 },
        children: []
      },
      column: {
        content: '',
        styles: { flex: '1', padding: '10px', minWidth: '250px' },
        settings: {},
        children: []
      },
      heading: {
        content: '<h2>Seu Título Aqui</h2>',
        styles: { fontSize: '32px', fontWeight: 'bold', color: '#1a1a1a', marginBottom: '16px' },
        settings: { tag: 'h2' }
      },
      text: {
        content: '<p>Seu texto aqui. Clique para editar.</p>',
        styles: { fontSize: '16px', lineHeight: '1.6', color: '#4a4a4a' },
        settings: {}
      },
      image: {
        content: '',
        styles: { width: '100%', height: 'auto', borderRadius: '8px' },
        settings: { src: 'https://via.placeholder.com/800x400', alt: 'Imagem', link: '' }
      },
      video: {
        content: '',
        styles: { width: '100%', aspectRatio: '16/9', borderRadius: '8px' },
        settings: { src: '', type: 'youtube', autoplay: false, controls: true }
      },
      button: {
        content: 'Clique Aqui',
        styles: { 
          padding: '14px 28px', 
          backgroundColor: '#3b82f6', 
          color: '#ffffff', 
          borderRadius: '8px', 
          fontWeight: '600',
          fontSize: '16px',
          border: 'none',
          cursor: 'pointer',
          display: 'inline-block',
          textAlign: 'center'
        },
        settings: { link: '#', target: '_self' }
      },
      spacer: {
        content: '',
        styles: { height: '40px' },
        settings: {}
      },
      divider: {
        content: '',
        styles: { borderTop: '2px solid #e5e7eb', margin: '20px 0' },
        settings: {}
      },
      html: {
        content: '<!-- Seu código HTML aqui -->',
        styles: {},
        settings: {}
      },
      icon: {
        content: '⭐',
        styles: { fontSize: '48px', textAlign: 'center' },
        settings: { icon: 'star' }
      },
      countdown: {
        content: '',
        styles: { textAlign: 'center' },
        settings: { endDate: '', message: 'Oferta termina em:' }
      },
      testimonial: {
        content: 'Este é um depoimento incrível sobre o produto ou serviço.',
        styles: { padding: '24px', backgroundColor: '#f8fafc', borderRadius: '12px' },
        settings: { author: 'Cliente Satisfeito', avatar: '', rating: 5 }
      },
      pricing: {
        content: '',
        styles: { padding: '32px', backgroundColor: '#ffffff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' },
        settings: { price: '97', currency: 'R$', period: '/mês', features: ['Recurso 1', 'Recurso 2', 'Recurso 3'], buttonText: 'Assinar Agora', buttonLink: '#' }
      },
      faq: {
        content: '',
        styles: { padding: '16px' },
        settings: { items: [{ question: 'Pergunta frequente?', answer: 'Resposta da pergunta.' }] }
      },
      gallery: {
        content: '',
        styles: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' },
        settings: { images: [] }
      },
      map: {
        content: '',
        styles: { width: '100%', height: '400px', borderRadius: '8px' },
        settings: { address: '', zoom: 15 }
      },
      social: {
        content: '',
        styles: { display: 'flex', gap: '12px', justifyContent: 'center' },
        settings: { links: [] }
      },
      form: {
        content: '',
        styles: { padding: '24px' },
        settings: { fields: [{ type: 'text', label: 'Nome', required: true }], submitText: 'Enviar' }
      }
    };

    return {
      id,
      type,
      parentId,
      ...defaults[type]
    } as BuilderElement;
  };

  const addElementToTree = (tree: BuilderElement[], parentId: string, newElement: BuilderElement): BuilderElement[] => {
    // If parentId is 'root' or empty, add to root level
    if (!parentId || parentId === 'root' || parentId === 'canvas') {
      return [...tree, newElement];
    }

    return tree.map(element => {
      if (element.id === parentId) {
        return {
          ...element,
          children: [...(element.children || []), newElement]
        };
      }
      if (element.children) {
        return {
          ...element,
          children: addElementToTree(element.children, parentId, newElement)
        };
      }
      return element;
    });
  };

  const moveElement = (tree: BuilderElement[], activeId: string, overId: string): BuilderElement[] => {
    // Simple reorder for now - can be enhanced for nested moves
    const flatElements = flattenElements(tree);
    const activeElement = flatElements.find(el => el.id === activeId);
    
    if (!activeElement) return tree;

    // Remove from current position and add at new position
    const withoutActive = removeElementFromTree(tree, activeId);
    return addElementToTree(withoutActive, overId, activeElement);
  };

  const flattenElements = (tree: BuilderElement[]): BuilderElement[] => {
    return tree.reduce((acc: BuilderElement[], element) => {
      acc.push(element);
      if (element.children) {
        acc.push(...flattenElements(element.children));
      }
      return acc;
    }, []);
  };

  const removeElementFromTree = (tree: BuilderElement[], elementId: string): BuilderElement[] => {
    return tree
      .filter(element => element.id !== elementId)
      .map(element => ({
        ...element,
        children: element.children ? removeElementFromTree(element.children, elementId) : undefined
      }));
  };

  const handleElementUpdate = (updatedElement: BuilderElement) => {
    const updateInTree = (tree: BuilderElement[]): BuilderElement[] => {
      return tree.map(element => {
        if (element.id === updatedElement.id) {
          return updatedElement;
        }
        if (element.children) {
          return {
            ...element,
            children: updateInTree(element.children)
          };
        }
        return element;
      });
    };

    const newElements = updateInTree(elements);
    setElements(newElements);
    setSelectedElement(updatedElement);
    addToHistory(newElements);
  };

  const handleDeleteElement = (elementId: string) => {
    const newElements = removeElementFromTree(elements, elementId);
    setElements(newElements);
    if (selectedElement?.id === elementId) {
      setSelectedElement(null);
    }
    addToHistory(newElements);
  };

  const handleDuplicateElement = (element: BuilderElement) => {
    const duplicated = {
      ...element,
      id: `${element.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      children: element.children ? duplicateChildren(element.children) : undefined
    };

    const parent = element.parentId || 'root';
    const newElements = addElementToTree(elements, parent, duplicated);
    setElements(newElements);
    addToHistory(newElements);
  };

  const duplicateChildren = (children: BuilderElement[]): BuilderElement[] => {
    return children.map(child => ({
      ...child,
      id: `${child.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      children: child.children ? duplicateChildren(child.children) : undefined
    }));
  };

  const getViewWidth = () => {
    switch (viewMode) {
      case 'mobile': return 'max-w-[375px]';
      case 'tablet': return 'max-w-[768px]';
      default: return 'max-w-full';
    }
  };

  const handleExportHtml = () => {
    // Generate HTML from elements
    const html = generateHtmlFromElements(elements, page?.settings);
    
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${pageSlug || 'pagina'}.html`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({ title: "HTML exportado com sucesso!" });
  };

  const generateHtmlFromElements = (elements: BuilderElement[], settings?: BuilderPage['settings']): string => {
    const renderElement = (element: BuilderElement): string => {
      const styles = Object.entries(element.styles || {})
        .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
        .join('; ');

      const childrenHtml = element.children?.map(renderElement).join('') || '';

      switch (element.type) {
        case 'section':
          return `<section style="${styles}">${childrenHtml || element.content}</section>`;
        case 'row':
          return `<div style="${styles}">${childrenHtml}</div>`;
        case 'column':
          return `<div style="${styles}">${childrenHtml}</div>`;
        case 'heading':
        case 'text':
          return `<div style="${styles}">${element.content}</div>`;
        case 'image':
          return `<img src="${element.settings?.src}" alt="${element.settings?.alt || ''}" style="${styles}" />`;
        case 'video':
          if (element.settings?.type === 'youtube') {
            return `<iframe src="https://www.youtube.com/embed/${element.settings?.src}" style="${styles}" frameborder="0" allowfullscreen></iframe>`;
          }
          return `<video src="${element.settings?.src}" style="${styles}" controls></video>`;
        case 'button':
          return `<a href="${element.settings?.link || '#'}" target="${element.settings?.target || '_self'}" style="${styles}">${element.content}</a>`;
        case 'spacer':
          return `<div style="${styles}"></div>`;
        case 'divider':
          return `<hr style="${styles}" />`;
        case 'html':
          return element.content;
        default:
          return `<div style="${styles}">${element.content}${childrenHtml}</div>`;
      }
    };

    const bodyContent = elements.map(renderElement).join('\n');

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${settings?.title || 'Página'}</title>
  <meta name="description" content="${settings?.description || ''}">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: ${settings?.fontFamily || 'Inter, sans-serif'}; background: ${settings?.backgroundColor || '#ffffff'}; }
    ${settings?.customCss || ''}
  </style>
</head>
<body class="${settings?.bodyClass || ''}">
${bodyContent}
${settings?.customJs ? `<script>${settings.customJs}</script>` : ''}
</body>
</html>`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="h-screen flex flex-col bg-background overflow-hidden">
        {/* Top Toolbar */}
        <BuilderToolbar
          pageName={pageName}
          viewMode={viewMode}
          setViewMode={setViewMode}
          showPreview={showPreview}
          setShowPreview={setShowPreview}
          showProperties={showProperties}
          setShowProperties={setShowProperties}
          historyIndex={historyIndex}
          historyLength={history.length}
          onUndo={undo}
          onRedo={redo}
          onSave={handleSave}
          onExport={handleExportHtml}
          saving={saving}
          onBack={() => navigate('/dashboard?tab=page-builder')}
        />

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Elements */}
          {!showPreview && (
            <BuilderSidebar
              activeTab={sidebarTab}
              onTabChange={setSidebarTab}
              elements={elements}
              selectedElement={selectedElement}
              onSelectElement={setSelectedElement}
              onDeleteElement={handleDeleteElement}
            />
          )}

          {/* Canvas Area */}
          <div className="flex-1 bg-muted/30 overflow-auto flex items-start justify-center p-4">
            <div className={`${getViewWidth()} w-full transition-all duration-300 bg-white shadow-xl rounded-lg overflow-hidden min-h-[600px]`}>
              <BuilderCanvas
                elements={elements}
                selectedElement={selectedElement}
                onSelectElement={setSelectedElement}
                onElementUpdate={handleElementUpdate}
                onDeleteElement={handleDeleteElement}
                onDuplicateElement={handleDuplicateElement}
                isPreview={showPreview}
                viewMode={viewMode}
                pageSettings={page?.settings}
              />
            </div>
          </div>

          {/* Right Sidebar - Properties */}
          {!showPreview && showProperties && selectedElement && (
            <BuilderProperties
              element={selectedElement}
              onUpdate={handleElementUpdate}
              onDelete={() => handleDeleteElement(selectedElement.id)}
              onDuplicate={() => handleDuplicateElement(selectedElement)}
              onClose={() => setSelectedElement(null)}
            />
          )}
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeId && <DragOverlayContent activeId={activeId} />}
        </DragOverlay>

        {/* Save Dialog */}
        <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Salvar Página</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nome da Página</label>
                <Input
                  value={pageName}
                  onChange={(e) => setPageName(e.target.value)}
                  placeholder="Minha Landing Page"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Slug (URL)</label>
                <Input
                  value={pageSlug}
                  onChange={(e) => setPageSlug(e.target.value)}
                  placeholder="minha-landing-page"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  URL: {window.location.origin}/p/{pageSlug || generateSlug(pageName) || 'sua-pagina'}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving} className="gradient-primary">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DndContext>
  );
};

export default PageBuilder;
