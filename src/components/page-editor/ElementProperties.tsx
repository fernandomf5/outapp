import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { X, Trash2, Type, Palette, Layout, Link as LinkIcon, Image as ImageIcon, Upload, Loader2 } from "lucide-react";
import { EditorElement } from "@/pages/PageEditor";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ElementPropertiesProps {
  element: EditorElement;
  onUpdate: (element: EditorElement) => void;
  onDelete: () => void;
  onClose: () => void;
  activeTab?: 'content' | 'style' | 'layout' | 'image' | 'link';
}

export const ElementProperties = ({ element, onUpdate, onDelete, onClose, activeTab = 'content' }: ElementPropertiesProps) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [currentTab, setCurrentTab] = useState(activeTab);

  // Update tab when activeTab prop changes
  useEffect(() => {
    if (activeTab) {
      // Map special tabs to their content
      if (activeTab === 'image' || activeTab === 'link') {
        setCurrentTab('content');
      } else {
        setCurrentTab(activeTab);
      }
    }
  }, [activeTab, element.id]);

  const updateStyle = (key: string, value: string) => {
    onUpdate({
      ...element,
      styles: {
        ...element.styles,
        [key]: value
      }
    });
  };

  const updateAttribute = (key: string, value: string) => {
    onUpdate({
      ...element,
      attributes: {
        ...element.attributes,
        [key]: value
      }
    });
  };

  const updateContent = (content: string) => {
    onUpdate({
      ...element,
      newContent: content
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: "Selecione uma imagem válida", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Imagem muito grande (máx 5MB)", variant: "destructive" });
      return;
    }

    setUploading(true);
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

      updateAttribute('src', publicUrl);
      toast({ title: "Imagem enviada com sucesso!" });
    } catch (error: any) {
      toast({ title: "Erro ao enviar imagem", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  // Determine what controls to show based on element type
  const isImage = element.type === 'image' || element.attributes?.tagName === 'img';
  const isLink = element.type === 'link' || element.type === 'button' || element.attributes?.tagName === 'a';
  const isText = element.type === 'text' || element.type === 'heading' || ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span'].includes(element.attributes?.tagName || '');
  const isVideo = element.type === 'video' || element.attributes?.tagName === 'video' || element.attributes?.tagName === 'iframe';

  return (
    <div className="w-80 border-l bg-card flex flex-col shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">
            {element.attributes?.label || element.type || 'Elemento'}
          </span>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
            {element.attributes?.tagName?.toUpperCase() || element.type}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
            onClick={onDelete}
            title="Excluir elemento"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={onClose}
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Properties Content */}
      <Tabs value={currentTab} onValueChange={(v) => setCurrentTab(v as any)} className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0 h-auto">
          <TabsTrigger 
            value="content" 
            className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-2 text-xs"
          >
            <Type className="w-3 h-3 mr-1" />
            Conteúdo
          </TabsTrigger>
          <TabsTrigger 
            value="style" 
            className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-2 text-xs"
          >
            <Palette className="w-3 h-3 mr-1" />
            Estilo
          </TabsTrigger>
          <TabsTrigger 
            value="layout" 
            className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-2 text-xs"
          >
            <Layout className="w-3 h-3 mr-1" />
            Layout
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          {/* Content Tab */}
          <TabsContent value="content" className="p-3 space-y-4 m-0">
            {/* Image Controls */}
            {isImage && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <ImageIcon className="w-4 h-4" />
                  <span className="font-medium text-sm">Imagem</span>
                </div>
                
                {/* Current Image Preview */}
                {element.attributes?.src && (
                  <div className="border rounded-lg p-2 bg-muted/30">
                    <img 
                      src={element.attributes.src} 
                      alt="Preview" 
                      className="max-h-24 mx-auto object-contain rounded"
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label className="text-xs font-medium">URL da Imagem</Label>
                  <Input
                    value={element.attributes?.src || ''}
                    onChange={(e) => updateAttribute('src', e.target.value)}
                    placeholder="https://..."
                    className="text-sm"
                  />
                </div>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">ou</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Upload de Imagem</Label>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition-colors cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="props-image-upload"
                      disabled={uploading}
                    />
                    <label htmlFor="props-image-upload" className="cursor-pointer block">
                      {uploading ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="w-8 h-8 animate-spin text-primary" />
                          <span className="text-sm text-muted-foreground">Enviando...</span>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground block">Clique para enviar</span>
                          <span className="text-xs text-muted-foreground block mt-1">PNG, JPG, WEBP até 5MB</span>
                        </>
                      )}
                    </label>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Texto Alternativo (Alt)</Label>
                  <Input
                    value={element.attributes?.alt || ''}
                    onChange={(e) => updateAttribute('alt', e.target.value)}
                    placeholder="Descrição da imagem"
                    className="text-sm"
                  />
                </div>
              </div>
            )}

            {/* Link/Button Controls */}
            {isLink && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <LinkIcon className="w-4 h-4" />
                  <span className="font-medium text-sm">Link</span>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs font-medium">URL do Link</Label>
                  <Input
                    value={element.attributes?.href || ''}
                    onChange={(e) => updateAttribute('href', e.target.value)}
                    placeholder="https://..."
                    className="text-sm"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch
                    id="open-new-tab"
                    checked={element.attributes?.target === '_blank'}
                    onCheckedChange={(checked) => updateAttribute('target', checked ? '_blank' : '_self')}
                  />
                  <Label htmlFor="open-new-tab" className="text-xs">Abrir em nova aba</Label>
                </div>
              </div>
            )}

            {/* Text Content */}
            {isText && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <Type className="w-4 h-4" />
                  <span className="font-medium text-sm">Texto</span>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Conteúdo</Label>
                  <Textarea
                    value={element.newContent || element.originalContent || ''}
                    onChange={(e) => updateContent(e.target.value)}
                    rows={4}
                    className="text-sm"
                    placeholder="Digite o texto..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Dica: Dê duplo clique no elemento para editar diretamente
                  </p>
                </div>
              </div>
            )}

            {/* Video Controls */}
            {isVideo && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <span className="font-medium text-sm">🎬 Vídeo</span>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs font-medium">URL do Vídeo</Label>
                  <Input
                    value={element.attributes?.src || ''}
                    onChange={(e) => updateAttribute('src', e.target.value)}
                    placeholder="https://youtube.com/... ou URL do vídeo"
                    className="text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Suporta YouTube, Vimeo ou link direto
                  </p>
                </div>
              </div>
            )}

            {/* Generic element - show basic info */}
            {!isImage && !isLink && !isText && !isVideo && (
              <div className="space-y-4">
                <div className="p-4 bg-muted/30 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">
                    Elemento: <strong>{element.attributes?.label || element.type}</strong>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Use as abas Estilo e Layout para editar
                  </p>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Style Tab */}
          <TabsContent value="style" className="p-3 space-y-4 m-0">
            {/* Background Color */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Cor de Fundo</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={element.styles?.backgroundColor || '#ffffff'}
                  onChange={(e) => updateStyle('backgroundColor', e.target.value)}
                  className="w-12 h-9 p-1 cursor-pointer"
                />
                <Input
                  value={element.styles?.backgroundColor || ''}
                  onChange={(e) => updateStyle('backgroundColor', e.target.value)}
                  placeholder="#ffffff ou transparent"
                  className="flex-1 text-sm"
                />
              </div>
            </div>

            {/* Text Color */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Cor do Texto</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={element.styles?.color || '#000000'}
                  onChange={(e) => updateStyle('color', e.target.value)}
                  className="w-12 h-9 p-1 cursor-pointer"
                />
                <Input
                  value={element.styles?.color || ''}
                  onChange={(e) => updateStyle('color', e.target.value)}
                  placeholder="#000000"
                  className="flex-1 text-sm"
                />
              </div>
            </div>

            {/* Font Size */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Tamanho da Fonte</Label>
              <Select
                value={element.styles?.fontSize || ''}
                onValueChange={(value) => updateStyle('fontSize', value)}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12px">12px - Pequeno</SelectItem>
                  <SelectItem value="14px">14px</SelectItem>
                  <SelectItem value="16px">16px - Normal</SelectItem>
                  <SelectItem value="18px">18px</SelectItem>
                  <SelectItem value="20px">20px</SelectItem>
                  <SelectItem value="24px">24px - Grande</SelectItem>
                  <SelectItem value="32px">32px - Título</SelectItem>
                  <SelectItem value="48px">48px - Destaque</SelectItem>
                  <SelectItem value="64px">64px - Hero</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Font Weight */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Peso da Fonte</Label>
              <Select
                value={element.styles?.fontWeight || ''}
                onValueChange={(value) => updateStyle('fontWeight', value)}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="300">Light</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="500">Médio</SelectItem>
                  <SelectItem value="600">Semi-Bold</SelectItem>
                  <SelectItem value="bold">Bold</SelectItem>
                  <SelectItem value="800">Extra Bold</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Border Radius */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Arredondamento: {element.styles?.borderRadius || '0px'}</Label>
              <Slider
                value={[parseInt(element.styles?.borderRadius || '0')]}
                onValueChange={([value]) => updateStyle('borderRadius', `${value}px`)}
                min={0}
                max={50}
                step={2}
                className="w-full"
              />
            </div>

            {/* Box Shadow */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Sombra</Label>
              <Select
                value={element.styles?.boxShadow || 'none'}
                onValueChange={(value) => updateStyle('boxShadow', value)}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  <SelectItem value="0 1px 3px rgba(0,0,0,0.1)">Suave</SelectItem>
                  <SelectItem value="0 4px 6px rgba(0,0,0,0.1)">Média</SelectItem>
                  <SelectItem value="0 10px 25px rgba(0,0,0,0.15)">Forte</SelectItem>
                  <SelectItem value="0 20px 40px rgba(0,0,0,0.2)">Dramática</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Opacity */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Opacidade: {Math.round((parseFloat(element.styles?.opacity || '1')) * 100)}%</Label>
              <Slider
                value={[parseFloat(element.styles?.opacity || '1') * 100]}
                onValueChange={([value]) => updateStyle('opacity', String(value / 100))}
                min={0}
                max={100}
                step={5}
                className="w-full"
              />
            </div>
          </TabsContent>

          {/* Layout Tab */}
          <TabsContent value="layout" className="p-3 space-y-4 m-0">
            {/* Width */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Largura</Label>
              <Select
                value={element.styles?.width || 'auto'}
                onValueChange={(value) => updateStyle('width', value)}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto</SelectItem>
                  <SelectItem value="100%">100%</SelectItem>
                  <SelectItem value="75%">75%</SelectItem>
                  <SelectItem value="50%">50%</SelectItem>
                  <SelectItem value="25%">25%</SelectItem>
                  <SelectItem value="fit-content">Ajustar ao conteúdo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Height */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Altura</Label>
              <Select
                value={element.styles?.height || 'auto'}
                onValueChange={(value) => updateStyle('height', value)}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto</SelectItem>
                  <SelectItem value="100%">100%</SelectItem>
                  <SelectItem value="100vh">Tela inteira</SelectItem>
                  <SelectItem value="50vh">Meia tela</SelectItem>
                  <SelectItem value="fit-content">Ajustar ao conteúdo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Padding */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Padding (interno): {element.styles?.padding || '0px'}</Label>
              <Slider
                value={[parseInt(element.styles?.padding || '0')]}
                onValueChange={([value]) => updateStyle('padding', `${value}px`)}
                min={0}
                max={80}
                step={4}
                className="w-full"
              />
            </div>

            {/* Margin */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Margin (externo): {element.styles?.margin || '0px'}</Label>
              <Slider
                value={[parseInt(element.styles?.margin || '0')]}
                onValueChange={([value]) => updateStyle('margin', `${value}px`)}
                min={0}
                max={80}
                step={4}
                className="w-full"
              />
            </div>

            {/* Text Align */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Alinhamento do Texto</Label>
              <Select
                value={element.styles?.textAlign || 'left'}
                onValueChange={(value) => updateStyle('textAlign', value)}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Esquerda</SelectItem>
                  <SelectItem value="center">Centro</SelectItem>
                  <SelectItem value="right">Direita</SelectItem>
                  <SelectItem value="justify">Justificado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Display */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Display</Label>
              <Select
                value={element.styles?.display || 'block'}
                onValueChange={(value) => updateStyle('display', value)}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="block">Block</SelectItem>
                  <SelectItem value="inline-block">Inline Block</SelectItem>
                  <SelectItem value="flex">Flex</SelectItem>
                  <SelectItem value="inline-flex">Inline Flex</SelectItem>
                  <SelectItem value="grid">Grid</SelectItem>
                  <SelectItem value="none">Oculto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Position */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Posição</Label>
              <Select
                value={element.styles?.position || 'relative'}
                onValueChange={(value) => updateStyle('position', value)}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relative">Relativa</SelectItem>
                  <SelectItem value="absolute">Absoluta</SelectItem>
                  <SelectItem value="fixed">Fixa</SelectItem>
                  <SelectItem value="sticky">Sticky</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
};
