import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, ArrowLeft, Save, Undo, Redo, Eye, EyeOff, Smartphone, Tablet, Monitor, Settings2 } from "lucide-react";
import { EditorSidebar } from "@/components/page-editor/EditorSidebar";
import { ElementProperties } from "@/components/page-editor/ElementProperties";
import { EditorCanvas } from "@/components/page-editor/EditorCanvas";

export interface EditorElement {
  id: string;
  type: 'text' | 'image' | 'video' | 'button' | 'section' | 'container' | 'icon' | 'divider' | 'spacer' | 'html' | 'heading' | 'link' | 'form-field' | 'element';
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
  
  // Dialog states for editing
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [stylesDialogOpen, setStylesDialogOpen] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState("");
  const [tempLinkUrl, setTempLinkUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  
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

  // Send update to iframe
  const sendUpdateToIframe = useCallback((elementId: string, updates: { content?: string; src?: string; href?: string; styles?: string }) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'update-element',
        elementId,
        ...updates
      }, '*');
    }
  }, []);

  const handleElementUpdate = useCallback((updatedElement: EditorElement) => {
    const newElements = elements.map(el => 
      el.id === updatedElement.id ? updatedElement : el
    );
    setElements(newElements);
    setSelectedElement(updatedElement);
    
    // Send updates to iframe
    const stylesToString = (styles: Record<string, string> | undefined) => {
      if (!styles) return '';
      return Object.entries(styles).map(([k, v]) => `${k}: ${v}`).join('; ');
    };

    sendUpdateToIframe(updatedElement.id, {
      content: updatedElement.newContent,
      src: updatedElement.attributes?.src,
      href: updatedElement.attributes?.href,
      styles: stylesToString(updatedElement.styles)
    });
  }, [elements, sendUpdateToIframe]);

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
    addToHistory(newElements, modifiedHtml);
  };

  const handleHtmlChange = (newHtml: string) => {
    setModifiedHtml(newHtml);
    addToHistory(elements, newHtml);
  };

  // Handle messages from iframe for opening dialogs
  const handleIframeAction = useCallback((action: string, elementId: string, data: any) => {
    // Find or create element
    let element = elements.find(el => el.id === elementId);
    if (!element) {
      element = {
        id: elementId,
        type: 'element',
        selector: `[data-editor-id="${elementId}"]`,
        attributes: {}
      };
      setElements(prev => [...prev, element!]);
    }
    setSelectedElement(element);

    if (action === 'change-image') {
      setTempImageUrl(data.currentSrc || '');
      setImageDialogOpen(true);
    } else if (action === 'edit-link') {
      setTempLinkUrl(data.currentHref || '');
      setLinkDialogOpen(true);
    } else if (action === 'edit-styles') {
      setStylesDialogOpen(true);
    }
  }, [elements]);

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedElement) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: "Selecione uma imagem válida", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Imagem muito grande (máx 5MB)", variant: "destructive" });
      return;
    }

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `editor-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('cloned-pages')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('cloned-pages')
        .getPublicUrl(filePath);

      setTempImageUrl(publicUrl);
      toast({ title: "Imagem enviada!" });
    } catch (error: any) {
      toast({ title: "Erro ao enviar imagem", description: error.message, variant: "destructive" });
    } finally {
      setUploadingImage(false);
    }
  };

  const applyImageChange = () => {
    if (!selectedElement || !tempImageUrl) return;
    
    const updatedElement = {
      ...selectedElement,
      type: 'image' as const,
      attributes: { ...selectedElement.attributes, src: tempImageUrl }
    };
    
    handleElementUpdate(updatedElement);
    setImageDialogOpen(false);
    setTempImageUrl('');
    toast({ title: "Imagem atualizada!" });
  };

  const applyLinkChange = () => {
    if (!selectedElement) return;
    
    const updatedElement = {
      ...selectedElement,
      type: 'button' as const,
      attributes: { ...selectedElement.attributes, href: tempLinkUrl }
    };
    
    handleElementUpdate(updatedElement);
    setLinkDialogOpen(false);
    setTempLinkUrl('');
    toast({ title: "Link atualizado!" });
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
              onIframeAction={handleIframeAction}
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

      {/* Image Dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Trocar Imagem</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>URL da Imagem</Label>
              <Input
                value={tempImageUrl}
                onChange={(e) => setTempImageUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="text-center text-sm text-muted-foreground">ou</div>
            <div className="space-y-2">
              <Label>Upload de Imagem</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition-colors cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="editor-image-upload"
                  disabled={uploadingImage}
                />
                <label htmlFor="editor-image-upload" className="cursor-pointer">
                  {uploadingImage ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Enviando...</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Clique para enviar uma imagem</span>
                  )}
                </label>
              </div>
            </div>
            {tempImageUrl && (
              <div className="border rounded-lg p-2">
                <img src={tempImageUrl} alt="Preview" className="max-h-32 mx-auto object-contain" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImageDialogOpen(false)}>Cancelar</Button>
            <Button onClick={applyImageChange} disabled={!tempImageUrl}>Aplicar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>URL do Link</Label>
              <Input
                value={tempLinkUrl}
                onChange={(e) => setTempLinkUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>Cancelar</Button>
            <Button onClick={applyLinkChange}>Aplicar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Styles Dialog */}
      <Dialog open={stylesDialogOpen} onOpenChange={setStylesDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Estilos</DialogTitle>
          </DialogHeader>
          {selectedElement && (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                <Label>Cor de Fundo</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={selectedElement.styles?.backgroundColor || '#ffffff'}
                    onChange={(e) => handleElementUpdate({
                      ...selectedElement,
                      styles: { ...selectedElement.styles, backgroundColor: e.target.value }
                    })}
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={selectedElement.styles?.backgroundColor || ''}
                    onChange={(e) => handleElementUpdate({
                      ...selectedElement,
                      styles: { ...selectedElement.styles, backgroundColor: e.target.value }
                    })}
                    placeholder="#ffffff"
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Cor do Texto</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={selectedElement.styles?.color || '#000000'}
                    onChange={(e) => handleElementUpdate({
                      ...selectedElement,
                      styles: { ...selectedElement.styles, color: e.target.value }
                    })}
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={selectedElement.styles?.color || ''}
                    onChange={(e) => handleElementUpdate({
                      ...selectedElement,
                      styles: { ...selectedElement.styles, color: e.target.value }
                    })}
                    placeholder="#000000"
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Tamanho da Fonte</Label>
                <Input
                  value={selectedElement.styles?.fontSize || ''}
                  onChange={(e) => handleElementUpdate({
                    ...selectedElement,
                    styles: { ...selectedElement.styles, fontSize: e.target.value }
                  })}
                  placeholder="16px"
                />
              </div>
              <div className="space-y-2">
                <Label>Padding</Label>
                <Input
                  value={selectedElement.styles?.padding || ''}
                  onChange={(e) => handleElementUpdate({
                    ...selectedElement,
                    styles: { ...selectedElement.styles, padding: e.target.value }
                  })}
                  placeholder="10px"
                />
              </div>
              <div className="space-y-2">
                <Label>Margin</Label>
                <Input
                  value={selectedElement.styles?.margin || ''}
                  onChange={(e) => handleElementUpdate({
                    ...selectedElement,
                    styles: { ...selectedElement.styles, margin: e.target.value }
                  })}
                  placeholder="10px"
                />
              </div>
              <div className="space-y-2">
                <Label>Arredondamento</Label>
                <Input
                  value={selectedElement.styles?.borderRadius || ''}
                  onChange={(e) => handleElementUpdate({
                    ...selectedElement,
                    styles: { ...selectedElement.styles, borderRadius: e.target.value }
                  })}
                  placeholder="8px"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setStylesDialogOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PageEditor;
