import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Save, Undo, Redo, Eye, EyeOff, Smartphone, Tablet, Monitor, Settings2 } from "lucide-react";
import { EditorSidebar } from "@/components/page-editor/EditorSidebar";
import { EditorToolbar } from "@/components/page-editor/EditorToolbar";
import { ElementProperties } from "@/components/page-editor/ElementProperties";
import { EditorCanvas } from "@/components/page-editor/EditorCanvas";

export interface EditorElement {
  id: string;
  type: 'text' | 'image' | 'video' | 'button' | 'section' | 'container' | 'icon' | 'divider' | 'spacer' | 'html';
  selector?: string;
  originalContent?: string;
  newContent?: string;
  styles?: Record<string, string>;
  attributes?: Record<string, string>;
  isNew?: boolean;
  position?: { x: number; y: number };
}

export interface EditorHistory {
  elements: EditorElement[];
  html: string;
}

const PageEditor = () => {
  const { pageId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageData, setPageData] = useState<any>(null);
  const [originalHtml, setOriginalHtml] = useState("");
  const [modifiedHtml, setModifiedHtml] = useState("");
  const [elements, setElements] = useState<EditorElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<EditorElement | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [sidebarTab, setSidebarTab] = useState<'elements' | 'layers' | 'settings'>('elements');
  const [showProperties, setShowProperties] = useState(true);
  
  // History for undo/redo
  const [history, setHistory] = useState<EditorHistory[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (pageId && user) {
      fetchPageData();
    }
  }, [pageId, user]);

  const fetchPageData = async () => {
    try {
      const { data, error } = await supabase
        .from('cloned_pages')
        .select('*')
        .eq('id', pageId)
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;

      setPageData(data);
      setOriginalHtml(data.page_content || "");
      setModifiedHtml(data.page_content || "");
      
      // Load existing modifications
      const settings = (data.custom_settings || {}) as Record<string, any>;
      if (settings.editor_elements) {
        setElements(settings.editor_elements as EditorElement[]);
      }
      
      // Initialize history
      const existingElements = (settings.editor_elements || []) as EditorElement[];
      setHistory([{ elements: existingElements, html: data.page_content || "" }]);
      setHistoryIndex(0);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar página",
        description: error.message,
        variant: "destructive"
      });
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const addToHistory = useCallback((newElements: EditorElement[], newHtml: string) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ elements: newElements, html: newHtml });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setElements(history[newIndex].elements);
      setModifiedHtml(history[newIndex].html);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setElements(history[newIndex].elements);
      setModifiedHtml(history[newIndex].html);
    }
  }, [history, historyIndex]);

  const handleSave = async () => {
    if (!pageData) return;
    
    setSaving(true);
    try {
      const updatedSettings = {
        ...pageData.custom_settings,
        editor_elements: elements
      };

      const { error } = await supabase
        .from('cloned_pages')
        .update({
          page_content: modifiedHtml,
          custom_settings: updatedSettings
        })
        .eq('id', pageId);

      if (error) throw error;

      toast({ title: "Página salva com sucesso!" });
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

  const handleElementUpdate = (updatedElement: EditorElement) => {
    const newElements = elements.map(el => 
      el.id === updatedElement.id ? updatedElement : el
    );
    setElements(newElements);
    setSelectedElement(updatedElement);
    
    // Apply changes to HTML
    applyElementChanges(newElements);
    addToHistory(newElements, modifiedHtml);
  };

  const handleAddElement = (element: EditorElement) => {
    const newElements = [...elements, element];
    setElements(newElements);
    setSelectedElement(element);
    addToHistory(newElements, modifiedHtml);
  };

  const handleElementDiscovered = (element: EditorElement) => {
    // Check if element already exists
    const exists = elements.find(el => el.id === element.id);
    if (!exists) {
      setElements(prev => [...prev, element]);
    }
  };

  const handleDeleteElement = (elementId: string) => {
    const newElements = elements.filter(el => el.id !== elementId);
    setElements(newElements);
    if (selectedElement?.id === elementId) {
      setSelectedElement(null);
    }
    applyElementChanges(newElements);
    addToHistory(newElements, modifiedHtml);
  };

  const applyElementChanges = (elementsToApply: EditorElement[]) => {
    let html = originalHtml;
    
    // Apply text/content replacements
    elementsToApply.forEach(element => {
      if (element.selector && element.newContent) {
        // This is a simplified version - real implementation would use DOM manipulation
        // For now, we'll handle it in the iframe
      }
    });
    
    setModifiedHtml(html);
  };

  const handleHtmlChange = (newHtml: string) => {
    setModifiedHtml(newHtml);
    addToHistory(elements, newHtml);
  };

  const getViewWidth = () => {
    switch (viewMode) {
      case 'mobile': return 'w-[375px]';
      case 'tablet': return 'w-[768px]';
      default: return 'w-full';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top Toolbar */}
      <div className="h-14 border-b bg-card flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div className="h-6 w-px bg-border" />
          <span className="font-medium text-sm truncate max-w-[200px]">
            {pageData?.slug || 'Editor'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode */}
          <div className="flex items-center border rounded-lg p-1 bg-muted/50">
            <Button
              variant={viewMode === 'desktop' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setViewMode('desktop')}
            >
              <Monitor className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'tablet' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setViewMode('tablet')}
            >
              <Tablet className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'mobile' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setViewMode('mobile')}
            >
              <Smartphone className="w-4 h-4" />
            </Button>
          </div>

          <div className="h-6 w-px bg-border" />

          {/* Undo/Redo */}
          <Button
            variant="ghost"
            size="sm"
            onClick={undo}
            disabled={historyIndex <= 0}
          >
            <Undo className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
          >
            <Redo className="w-4 h-4" />
          </Button>

          <div className="h-6 w-px bg-border" />

          {/* Preview Toggle */}
          <Button
            variant={showPreview ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            {showPreview ? 'Editar' : 'Preview'}
          </Button>

          {/* Properties Toggle */}
          <Button
            variant={showProperties ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setShowProperties(!showProperties)}
          >
            <Settings2 className="w-4 h-4" />
          </Button>

          <div className="h-6 w-px bg-border" />

          {/* Save */}
          <Button onClick={handleSave} disabled={saving} className="gradient-primary">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Salvar
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Elements */}
        {!showPreview && (
          <EditorSidebar
            activeTab={sidebarTab}
            onTabChange={setSidebarTab}
            elements={elements}
            selectedElement={selectedElement}
            onSelectElement={setSelectedElement}
            onAddElement={handleAddElement}
            onDeleteElement={handleDeleteElement}
          />
        )}

        {/* Canvas Area */}
        <div className="flex-1 bg-muted/30 overflow-auto flex items-start justify-center p-4">
          <div className={`${getViewWidth()} transition-all duration-300 bg-white shadow-xl rounded-lg overflow-hidden`}>
            <EditorCanvas
              ref={iframeRef}
              html={modifiedHtml}
              elements={elements}
              selectedElement={selectedElement}
              onSelectElement={setSelectedElement}
              onElementUpdate={handleElementUpdate}
              onHtmlChange={handleHtmlChange}
              onElementDiscovered={handleElementDiscovered}
              isPreview={showPreview}
              viewMode={viewMode}
            />
          </div>
        </div>

        {/* Right Sidebar - Properties */}
        {!showPreview && showProperties && selectedElement && (
          <ElementProperties
            element={selectedElement}
            onUpdate={handleElementUpdate}
            onDelete={() => handleDeleteElement(selectedElement.id)}
            onClose={() => setSelectedElement(null)}
          />
        )}
      </div>
    </div>
  );
};

export default PageEditor;
