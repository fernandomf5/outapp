import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { X, Trash2, Type, Palette, Layout, Link as LinkIcon, Image as ImageIcon, Upload, Loader2, Copy } from "lucide-react";
import { EditorElement } from "@/pages/PageEditor";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ElementPropertiesProps {
  element: EditorElement;
  onUpdate: (element: EditorElement) => void;
  onDelete: () => void;
  onClose: () => void;
  onDuplicate: () => void;
  activeTab?: 'content' | 'style' | 'layout';
}

export const ElementProperties = ({ element, onUpdate, onDelete, onClose, onDuplicate, activeTab = 'content' }: ElementPropertiesProps) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [currentTab, setCurrentTab] = useState(activeTab);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update tab when activeTab prop changes
  useEffect(() => {
    setCurrentTab(activeTab);
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
      toast({ title: "Imagem enviada!" });
    } catch (error: any) {
      toast({ title: "Erro ao enviar", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  // Determine element type
  const isImage = element.type === 'image' || element.attributes?.tagName === 'img';
  const isLink = element.type === 'link' || element.type === 'button' || element.attributes?.tagName === 'a' || element.attributes?.tagName === 'button';
  const isText = element.type === 'text' || element.type === 'heading' || ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'li'].includes(element.attributes?.tagName || '');
  const isVideo = element.type === 'video' || element.attributes?.tagName === 'video' || element.attributes?.tagName === 'iframe';

  return (
    <div className="w-80 border-l bg-card flex flex-col shrink-0 h-full overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">
              {element.attributes?.label || element.type || 'Elemento'}
            </span>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
              {element.attributes?.tagName?.toUpperCase() || element.type?.toUpperCase()}
            </span>
          </div>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={onDuplicate}>
            <Copy className="w-3 h-3 mr-1" />
            Duplicar
          </Button>
          <Button variant="destructive" size="sm" className="flex-1 text-xs" onClick={onDelete}>
            <Trash2 className="w-3 h-3 mr-1" />
            Excluir
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={currentTab} onValueChange={(v) => setCurrentTab(v as any)} className="flex-1 flex flex-col min-h-0">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0 h-auto shrink-0">
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

        <div className="flex-1 overflow-y-auto min-h-0">
          {/* Content Tab */}
          <TabsContent value="content" className="p-3 space-y-4 m-0">
            
            {/* Image Controls */}
            {isImage && (
              <div className="space-y-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                  <ImageIcon className="w-4 h-4" />
                  <span className="font-medium text-sm">Trocar Imagem</span>
                </div>
                
                {element.attributes?.src && (
                  <div className="border rounded-lg p-2 bg-white dark:bg-background">
                    <img 
                      src={element.attributes.src} 
                      alt="Preview" 
                      className="max-h-20 mx-auto object-contain rounded"
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label className="text-xs">URL da Imagem</Label>
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
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-blue-50 dark:bg-blue-950/30 px-2 text-muted-foreground">ou</span>
                  </div>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Fazer Upload
                    </>
                  )}
                </Button>
                
                <div className="space-y-2">
                  <Label className="text-xs">Texto Alt</Label>
                  <Input
                    value={element.attributes?.alt || ''}
                    onChange={(e) => updateAttribute('alt', e.target.value)}
                    placeholder="Descrição da imagem"
                    className="text-sm"
                  />
                </div>
              </div>
            )}

            {/* Link Controls */}
            {isLink && (
              <div className="space-y-3 p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-900">
                <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                  <LinkIcon className="w-4 h-4" />
                  <span className="font-medium text-sm">Editar Link</span>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs">URL do Link</Label>
                  <Input
                    value={element.attributes?.href || ''}
                    onChange={(e) => updateAttribute('href', e.target.value)}
                    placeholder="https://..."
                    className="text-sm"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch
                    checked={element.attributes?.target === '_blank'}
                    onCheckedChange={(checked) => updateAttribute('target', checked ? '_blank' : '_self')}
                  />
                  <Label className="text-xs">Abrir em nova aba</Label>
                </div>
              </div>
            )}

            {/* Text Controls */}
            {isText && (
              <div className="space-y-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-900">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                  <Type className="w-4 h-4" />
                  <span className="font-medium text-sm">Editar Texto</span>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs">Conteúdo</Label>
                  <Textarea
                    value={element.newContent || element.originalContent || ''}
                    onChange={(e) => updateContent(e.target.value)}
                    rows={4}
                    className="text-sm"
                    placeholder="Digite o texto..."
                  />
                  <p className="text-xs text-muted-foreground">
                    💡 Dê duplo clique no elemento para editar diretamente
                  </p>
                </div>
              </div>
            )}

            {/* Video Controls */}
            {isVideo && (
              <div className="space-y-3 p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200 dark:border-orange-900">
                <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
                  <span className="text-sm">🎬</span>
                  <span className="font-medium text-sm">Vídeo</span>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs">URL do Vídeo</Label>
                  <Input
                    value={element.attributes?.src || ''}
                    onChange={(e) => updateAttribute('src', e.target.value)}
                    placeholder="https://youtube.com/..."
                    className="text-sm"
                  />
                </div>
              </div>
            )}

            {/* Generic element info */}
            {!isImage && !isLink && !isText && !isVideo && (
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">
                  Elemento: <strong>{element.attributes?.tagName?.toUpperCase()}</strong>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Use as abas Estilo e Layout para personalizar
                </p>
              </div>
            )}
          </TabsContent>

          {/* Style Tab */}
          <TabsContent value="style" className="p-3 space-y-4 m-0">
            {/* Background */}
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
                  placeholder="transparent"
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
                  <SelectItem value="12px">12px</SelectItem>
                  <SelectItem value="14px">14px</SelectItem>
                  <SelectItem value="16px">16px</SelectItem>
                  <SelectItem value="18px">18px</SelectItem>
                  <SelectItem value="20px">20px</SelectItem>
                  <SelectItem value="24px">24px</SelectItem>
                  <SelectItem value="32px">32px</SelectItem>
                  <SelectItem value="48px">48px</SelectItem>
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
                  <SelectItem value="bold">Bold</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Border Radius */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Arredondamento</Label>
              <div className="flex items-center gap-2">
                <Slider
                  value={[parseInt(element.styles?.borderRadius || '0')]}
                  onValueChange={([value]) => updateStyle('borderRadius', `${value}px`)}
                  max={50}
                  step={1}
                  className="flex-1"
                />
                <span className="text-xs w-12 text-right">{element.styles?.borderRadius || '0px'}</span>
              </div>
            </div>

            {/* Border */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Borda</Label>
              <Input
                value={element.styles?.border || ''}
                onChange={(e) => updateStyle('border', e.target.value)}
                placeholder="1px solid #ccc"
                className="text-sm"
              />
            </div>

            {/* Box Shadow */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Sombra</Label>
              <Select
                value={element.styles?.boxShadow || ''}
                onValueChange={(value) => updateStyle('boxShadow', value)}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Nenhuma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  <SelectItem value="0 1px 3px rgba(0,0,0,0.12)">Suave</SelectItem>
                  <SelectItem value="0 4px 6px rgba(0,0,0,0.1)">Média</SelectItem>
                  <SelectItem value="0 10px 25px rgba(0,0,0,0.15)">Forte</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Opacity */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Opacidade</Label>
              <div className="flex items-center gap-2">
                <Slider
                  value={[parseFloat(element.styles?.opacity || '1') * 100]}
                  onValueChange={([value]) => updateStyle('opacity', String(value / 100))}
                  max={100}
                  step={5}
                  className="flex-1"
                />
                <span className="text-xs w-12 text-right">{Math.round(parseFloat(element.styles?.opacity || '1') * 100)}%</span>
              </div>
            </div>
          </TabsContent>

          {/* Layout Tab */}
          <TabsContent value="layout" className="p-3 space-y-4 m-0">
            {/* Width */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Largura</Label>
              <Input
                value={element.styles?.width || ''}
                onChange={(e) => updateStyle('width', e.target.value)}
                placeholder="auto, 100%, 300px"
                className="text-sm"
              />
            </div>

            {/* Height */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Altura</Label>
              <Input
                value={element.styles?.height || ''}
                onChange={(e) => updateStyle('height', e.target.value)}
                placeholder="auto, 100%, 200px"
                className="text-sm"
              />
            </div>

            {/* Margin */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Margem Externa</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={element.styles?.marginTop || ''}
                  onChange={(e) => updateStyle('marginTop', e.target.value)}
                  placeholder="Topo"
                  className="text-sm"
                />
                <Input
                  value={element.styles?.marginBottom || ''}
                  onChange={(e) => updateStyle('marginBottom', e.target.value)}
                  placeholder="Base"
                  className="text-sm"
                />
                <Input
                  value={element.styles?.marginLeft || ''}
                  onChange={(e) => updateStyle('marginLeft', e.target.value)}
                  placeholder="Esquerda"
                  className="text-sm"
                />
                <Input
                  value={element.styles?.marginRight || ''}
                  onChange={(e) => updateStyle('marginRight', e.target.value)}
                  placeholder="Direita"
                  className="text-sm"
                />
              </div>
            </div>

            {/* Padding */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Margem Interna</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={element.styles?.paddingTop || ''}
                  onChange={(e) => updateStyle('paddingTop', e.target.value)}
                  placeholder="Topo"
                  className="text-sm"
                />
                <Input
                  value={element.styles?.paddingBottom || ''}
                  onChange={(e) => updateStyle('paddingBottom', e.target.value)}
                  placeholder="Base"
                  className="text-sm"
                />
                <Input
                  value={element.styles?.paddingLeft || ''}
                  onChange={(e) => updateStyle('paddingLeft', e.target.value)}
                  placeholder="Esquerda"
                  className="text-sm"
                />
                <Input
                  value={element.styles?.paddingRight || ''}
                  onChange={(e) => updateStyle('paddingRight', e.target.value)}
                  placeholder="Direita"
                  className="text-sm"
                />
              </div>
            </div>

            {/* Display */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Display</Label>
              <Select
                value={element.styles?.display || ''}
                onValueChange={(value) => updateStyle('display', value)}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Padrão" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="block">Block</SelectItem>
                  <SelectItem value="inline-block">Inline Block</SelectItem>
                  <SelectItem value="flex">Flex</SelectItem>
                  <SelectItem value="none">Oculto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Text Align */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Alinhamento</Label>
              <Select
                value={element.styles?.textAlign || ''}
                onValueChange={(value) => updateStyle('textAlign', value)}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Padrão" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Esquerda</SelectItem>
                  <SelectItem value="center">Centro</SelectItem>
                  <SelectItem value="right">Direita</SelectItem>
                  <SelectItem value="justify">Justificado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};
