import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { X, Trash2, Type, Palette, Layout, Link, Image as ImageIcon, Upload } from "lucide-react";
import { EditorElement } from "@/pages/PageEditor";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ElementPropertiesProps {
  element: EditorElement;
  onUpdate: (element: EditorElement) => void;
  onDelete: () => void;
  onClose: () => void;
}

export const ElementProperties = ({ element, onUpdate, onDelete, onClose }: ElementPropertiesProps) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

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
        .from('uploads')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(filePath);

      updateAttribute('src', publicUrl);
      toast({ title: "Imagem enviada!" });
    } catch (error: any) {
      toast({ title: "Erro ao enviar imagem", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-72 border-l bg-card flex flex-col shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <span className="font-medium text-sm">Propriedades</span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Properties Content */}
      <Tabs defaultValue="content" className="flex-1 flex flex-col">
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
            {/* Text Content */}
            {(element.type === 'text' || element.type === 'button' || element.type === 'html') && (
              <div className="space-y-2">
                <Label className="text-xs">Conteúdo</Label>
                <Textarea
                  value={element.newContent || ''}
                  onChange={(e) => updateContent(e.target.value)}
                  rows={element.type === 'html' ? 6 : 3}
                  className="text-sm font-mono"
                  placeholder={element.type === 'html' ? 'Cole seu código HTML...' : 'Digite o texto...'}
                />
              </div>
            )}

            {/* Image Upload */}
            {element.type === 'image' && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-xs">URL da Imagem</Label>
                  <Input
                    value={element.attributes?.src || ''}
                    onChange={(e) => updateAttribute('src', e.target.value)}
                    placeholder="https://..."
                    className="text-sm"
                  />
                </div>
                <div className="text-center text-xs text-muted-foreground">ou</div>
                <div className="space-y-2">
                  <Label className="text-xs">Upload de Imagem</Label>
                  <div className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-muted/50 transition-colors cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                      disabled={uploading}
                    />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      {uploading ? (
                        <span className="text-xs text-muted-foreground">Enviando...</span>
                      ) : (
                        <>
                          <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Clique para enviar</span>
                        </>
                      )}
                    </label>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Texto Alternativo (Alt)</Label>
                  <Input
                    value={element.attributes?.alt || ''}
                    onChange={(e) => updateAttribute('alt', e.target.value)}
                    placeholder="Descrição da imagem"
                    className="text-sm"
                  />
                </div>
              </div>
            )}

            {/* Video URL */}
            {element.type === 'video' && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-xs">URL do Vídeo</Label>
                  <Input
                    value={element.attributes?.src || ''}
                    onChange={(e) => updateAttribute('src', e.target.value)}
                    placeholder="https://youtube.com/... ou URL do vídeo"
                    className="text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Suporta YouTube, Vimeo ou link direto do vídeo
                  </p>
                </div>
              </div>
            )}

            {/* Button/Link Properties */}
            {element.type === 'button' && (
              <div className="space-y-2">
                <Label className="text-xs">Link (URL)</Label>
                <Input
                  value={element.attributes?.href || ''}
                  onChange={(e) => updateAttribute('href', e.target.value)}
                  placeholder="https://..."
                  className="text-sm"
                />
                <div className="flex items-center gap-2 pt-2">
                  <Switch
                    checked={element.attributes?.target === '_blank'}
                    onCheckedChange={(checked) => updateAttribute('target', checked ? '_blank' : '_self')}
                  />
                  <Label className="text-xs">Abrir em nova aba</Label>
                </div>
              </div>
            )}

            {/* Spacer Height */}
            {element.type === 'spacer' && (
              <div className="space-y-2">
                <Label className="text-xs">Altura (px)</Label>
                <div className="flex items-center gap-3">
                  <Slider
                    value={[parseInt(element.styles?.height || '40')]}
                    onValueChange={([value]) => updateStyle('height', `${value}px`)}
                    min={10}
                    max={200}
                    step={5}
                    className="flex-1"
                  />
                  <span className="text-xs text-muted-foreground w-12 text-right">
                    {element.styles?.height || '40px'}
                  </span>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Style Tab */}
          <TabsContent value="style" className="p-3 space-y-4 m-0">
            {/* Background Color */}
            <div className="space-y-2">
              <Label className="text-xs">Cor de Fundo</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={element.styles?.backgroundColor || '#ffffff'}
                  onChange={(e) => updateStyle('backgroundColor', e.target.value)}
                  className="w-10 h-8 p-1 cursor-pointer"
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
            {(element.type === 'text' || element.type === 'button') && (
              <div className="space-y-2">
                <Label className="text-xs">Cor do Texto</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={element.styles?.color || '#000000'}
                    onChange={(e) => updateStyle('color', e.target.value)}
                    className="w-10 h-8 p-1 cursor-pointer"
                  />
                  <Input
                    value={element.styles?.color || ''}
                    onChange={(e) => updateStyle('color', e.target.value)}
                    placeholder="#000000"
                    className="flex-1 text-sm"
                  />
                </div>
              </div>
            )}

            {/* Font Size */}
            {(element.type === 'text' || element.type === 'button') && (
              <div className="space-y-2">
                <Label className="text-xs">Tamanho da Fonte</Label>
                <Select
                  value={element.styles?.fontSize || '16px'}
                  onValueChange={(value) => updateStyle('fontSize', value)}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue />
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
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Font Weight */}
            {(element.type === 'text' || element.type === 'button') && (
              <div className="space-y-2">
                <Label className="text-xs">Peso da Fonte</Label>
                <Select
                  value={element.styles?.fontWeight || 'normal'}
                  onValueChange={(value) => updateStyle('fontWeight', value)}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="500">Médio</SelectItem>
                    <SelectItem value="600">Semi-Bold</SelectItem>
                    <SelectItem value="bold">Bold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Border Radius */}
            <div className="space-y-2">
              <Label className="text-xs">Arredondamento</Label>
              <div className="flex items-center gap-3">
                <Slider
                  value={[parseInt(element.styles?.borderRadius || '0')]}
                  onValueChange={([value]) => updateStyle('borderRadius', `${value}px`)}
                  min={0}
                  max={50}
                  step={2}
                  className="flex-1"
                />
                <span className="text-xs text-muted-foreground w-12 text-right">
                  {element.styles?.borderRadius || '0px'}
                </span>
              </div>
            </div>

            {/* Box Shadow */}
            <div className="space-y-2">
              <Label className="text-xs">Sombra</Label>
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
          </TabsContent>

          {/* Layout Tab */}
          <TabsContent value="layout" className="p-3 space-y-4 m-0">
            {/* Width */}
            <div className="space-y-2">
              <Label className="text-xs">Largura</Label>
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
                  <SelectItem value="fit-content">Ajustar ao conteúdo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Padding */}
            <div className="space-y-2">
              <Label className="text-xs">Padding (interno)</Label>
              <div className="flex items-center gap-3">
                <Slider
                  value={[parseInt(element.styles?.padding || '0')]}
                  onValueChange={([value]) => updateStyle('padding', `${value}px`)}
                  min={0}
                  max={60}
                  step={4}
                  className="flex-1"
                />
                <span className="text-xs text-muted-foreground w-12 text-right">
                  {element.styles?.padding || '0px'}
                </span>
              </div>
            </div>

            {/* Margin */}
            <div className="space-y-2">
              <Label className="text-xs">Margin (externo)</Label>
              <div className="flex items-center gap-3">
                <Slider
                  value={[parseInt(element.styles?.margin || '0')]}
                  onValueChange={([value]) => updateStyle('margin', `${value}px`)}
                  min={0}
                  max={60}
                  step={4}
                  className="flex-1"
                />
                <span className="text-xs text-muted-foreground w-12 text-right">
                  {element.styles?.margin || '0px'}
                </span>
              </div>
            </div>

            {/* Text Align */}
            {(element.type === 'text' || element.type === 'button' || element.type === 'section') && (
              <div className="space-y-2">
                <Label className="text-xs">Alinhamento do Texto</Label>
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
            )}

            {/* Display */}
            <div className="space-y-2">
              <Label className="text-xs">Display</Label>
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
                  <SelectItem value="none">Oculto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
};
