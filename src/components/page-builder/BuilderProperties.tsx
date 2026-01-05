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
import { X, Trash2, Copy, Type, Palette, Layout, Settings, Upload } from "lucide-react";
import { BuilderElement } from "@/pages/PageBuilder";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BuilderPropertiesProps {
  element: BuilderElement;
  onUpdate: (element: BuilderElement) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onClose: () => void;
}

export const BuilderProperties = ({ 
  element, 
  onUpdate, 
  onDelete, 
  onDuplicate,
  onClose 
}: BuilderPropertiesProps) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const updateStyle = (key: string, value: string) => {
    onUpdate({
      ...element,
      styles: { ...element.styles, [key]: value }
    });
  };

  const updateSetting = (key: string, value: any) => {
    onUpdate({
      ...element,
      settings: { ...element.settings, [key]: value }
    });
  };

  const updateContent = (content: string) => {
    onUpdate({ ...element, content });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: "Selecione uma imagem válida", variant: "destructive" });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Imagem muito grande (máx 10MB)", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `page-builder/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(filePath);

      updateSetting('src', publicUrl);
      toast({ title: "Imagem enviada!" });
    } catch (error: any) {
      toast({ title: "Erro ao enviar imagem", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-80 border-l bg-card flex flex-col shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <span className="font-medium text-sm capitalize">{element.type}</span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onDuplicate} title="Duplicar">
            <Copy className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={onDelete} title="Excluir">
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="content" className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0 h-auto">
          <TabsTrigger value="content" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-2.5 text-xs">
            <Settings className="w-3.5 h-3.5 mr-1" />
            Conteúdo
          </TabsTrigger>
          <TabsTrigger value="style" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-2.5 text-xs">
            <Palette className="w-3.5 h-3.5 mr-1" />
            Estilo
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-2.5 text-xs">
            <Layout className="w-3.5 h-3.5 mr-1" />
            Avançado
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          {/* Content Tab */}
          <TabsContent value="content" className="p-4 space-y-4 m-0">
            {/* Text Content */}
            {['heading', 'text', 'button', 'html'].includes(element.type) && (
              <div className="space-y-2">
                <Label>Conteúdo</Label>
                <Textarea
                  value={element.content || ''}
                  onChange={(e) => updateContent(e.target.value)}
                  rows={element.type === 'html' ? 8 : 4}
                  className="text-sm font-mono"
                />
              </div>
            )}

            {/* Image Settings */}
            {element.type === 'image' && (
              <>
                <div className="space-y-2">
                  <Label>URL da Imagem</Label>
                  <Input
                    value={element.settings?.src || ''}
                    onChange={(e) => updateSetting('src', e.target.value)}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Upload</Label>
                  <div className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-muted/50 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="builder-image-upload"
                      disabled={uploading}
                    />
                    <label htmlFor="builder-image-upload" className="cursor-pointer">
                      {uploading ? (
                        <span className="text-sm text-muted-foreground">Enviando...</span>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Clique para enviar</span>
                        </>
                      )}
                    </label>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Alt Text</Label>
                  <Input
                    value={element.settings?.alt || ''}
                    onChange={(e) => updateSetting('alt', e.target.value)}
                    placeholder="Descrição da imagem"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Link</Label>
                  <Input
                    value={element.settings?.link || ''}
                    onChange={(e) => updateSetting('link', e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </>
            )}

            {/* Video Settings */}
            {element.type === 'video' && (
              <>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={element.settings?.type || 'youtube'}
                    onValueChange={(v) => updateSetting('type', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="youtube">YouTube</SelectItem>
                      <SelectItem value="vimeo">Vimeo</SelectItem>
                      <SelectItem value="direct">Link Direto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>URL do Vídeo</Label>
                  <Input
                    value={element.settings?.src || ''}
                    onChange={(e) => updateSetting('src', e.target.value)}
                    placeholder="https://youtube.com/..."
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={element.settings?.autoplay || false}
                    onCheckedChange={(v) => updateSetting('autoplay', v)}
                  />
                  <Label>Autoplay</Label>
                </div>
              </>
            )}

            {/* Button Settings */}
            {element.type === 'button' && (
              <>
                <div className="space-y-2">
                  <Label>Link</Label>
                  <Input
                    value={element.settings?.link || ''}
                    onChange={(e) => updateSetting('link', e.target.value)}
                    placeholder="https://..."
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={element.settings?.target === '_blank'}
                    onCheckedChange={(v) => updateSetting('target', v ? '_blank' : '_self')}
                  />
                  <Label>Abrir em nova aba</Label>
                </div>
              </>
            )}

            {/* Spacer Settings */}
            {element.type === 'spacer' && (
              <div className="space-y-2">
                <Label>Altura</Label>
                <div className="flex items-center gap-3">
                  <Slider
                    value={[parseInt(element.styles?.height || '40')]}
                    onValueChange={([v]) => updateStyle('height', `${v}px`)}
                    min={10}
                    max={300}
                    step={5}
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground w-16 text-right">
                    {element.styles?.height || '40px'}
                  </span>
                </div>
              </div>
            )}

            {/* Section/Container Settings */}
            {['section', 'row', 'column'].includes(element.type) && (
              <>
                <div className="space-y-2">
                  <Label>Largura do Container</Label>
                  <Select
                    value={element.settings?.containerWidth || '1200px'}
                    onValueChange={(v) => updateSetting('containerWidth', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="100%">Full Width</SelectItem>
                      <SelectItem value="1400px">1400px</SelectItem>
                      <SelectItem value="1200px">1200px</SelectItem>
                      <SelectItem value="1000px">1000px</SelectItem>
                      <SelectItem value="800px">800px</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={element.settings?.fullWidth || false}
                    onCheckedChange={(v) => updateSetting('fullWidth', v)}
                  />
                  <Label>Largura Total</Label>
                </div>
              </>
            )}
          </TabsContent>

          {/* Style Tab */}
          <TabsContent value="style" className="p-4 space-y-4 m-0">
            {/* Background Color */}
            <div className="space-y-2">
              <Label>Cor de Fundo</Label>
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
                  className="flex-1"
                />
              </div>
            </div>

            {/* Text Color */}
            {['heading', 'text', 'button'].includes(element.type) && (
              <div className="space-y-2">
                <Label>Cor do Texto</Label>
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
                    className="flex-1"
                  />
                </div>
              </div>
            )}

            {/* Font Size */}
            {['heading', 'text', 'button'].includes(element.type) && (
              <div className="space-y-2">
                <Label>Tamanho da Fonte</Label>
                <Select
                  value={element.styles?.fontSize || '16px'}
                  onValueChange={(v) => updateStyle('fontSize', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12px">12px</SelectItem>
                    <SelectItem value="14px">14px</SelectItem>
                    <SelectItem value="16px">16px</SelectItem>
                    <SelectItem value="18px">18px</SelectItem>
                    <SelectItem value="20px">20px</SelectItem>
                    <SelectItem value="24px">24px</SelectItem>
                    <SelectItem value="32px">32px</SelectItem>
                    <SelectItem value="40px">40px</SelectItem>
                    <SelectItem value="48px">48px</SelectItem>
                    <SelectItem value="56px">56px</SelectItem>
                    <SelectItem value="64px">64px</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Font Weight */}
            {['heading', 'text', 'button'].includes(element.type) && (
              <div className="space-y-2">
                <Label>Peso da Fonte</Label>
                <Select
                  value={element.styles?.fontWeight || 'normal'}
                  onValueChange={(v) => updateStyle('fontWeight', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="300">Light</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="500">Medium</SelectItem>
                    <SelectItem value="600">SemiBold</SelectItem>
                    <SelectItem value="bold">Bold</SelectItem>
                    <SelectItem value="800">ExtraBold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Border Radius */}
            <div className="space-y-2">
              <Label>Arredondamento</Label>
              <div className="flex items-center gap-3">
                <Slider
                  value={[parseInt(element.styles?.borderRadius || '0')]}
                  onValueChange={([v]) => updateStyle('borderRadius', `${v}px`)}
                  min={0}
                  max={50}
                  step={2}
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground w-12 text-right">
                  {element.styles?.borderRadius || '0px'}
                </span>
              </div>
            </div>

            {/* Box Shadow */}
            <div className="space-y-2">
              <Label>Sombra</Label>
              <Select
                value={element.styles?.boxShadow || 'none'}
                onValueChange={(v) => updateStyle('boxShadow', v)}
              >
                <SelectTrigger>
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

          {/* Advanced Tab */}
          <TabsContent value="advanced" className="p-4 space-y-4 m-0">
            {/* Padding */}
            <div className="space-y-2">
              <Label>Padding</Label>
              <div className="flex items-center gap-3">
                <Slider
                  value={[parseInt(element.styles?.padding || '0')]}
                  onValueChange={([v]) => updateStyle('padding', `${v}px`)}
                  min={0}
                  max={100}
                  step={4}
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground w-12 text-right">
                  {element.styles?.padding || '0px'}
                </span>
              </div>
            </div>

            {/* Margin */}
            <div className="space-y-2">
              <Label>Margin</Label>
              <div className="flex items-center gap-3">
                <Slider
                  value={[parseInt(element.styles?.margin || '0')]}
                  onValueChange={([v]) => updateStyle('margin', `${v}px`)}
                  min={0}
                  max={100}
                  step={4}
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground w-12 text-right">
                  {element.styles?.margin || '0px'}
                </span>
              </div>
            </div>

            {/* Text Align */}
            {['heading', 'text', 'button'].includes(element.type) && (
              <div className="space-y-2">
                <Label>Alinhamento</Label>
                <Select
                  value={element.styles?.textAlign || 'left'}
                  onValueChange={(v) => updateStyle('textAlign', v)}
                >
                  <SelectTrigger>
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

            {/* Width */}
            <div className="space-y-2">
              <Label>Largura</Label>
              <Select
                value={element.styles?.width || 'auto'}
                onValueChange={(v) => updateStyle('width', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto</SelectItem>
                  <SelectItem value="100%">100%</SelectItem>
                  <SelectItem value="75%">75%</SelectItem>
                  <SelectItem value="50%">50%</SelectItem>
                  <SelectItem value="fit-content">Ajustar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* CSS Class */}
            <div className="space-y-2">
              <Label>Classe CSS</Label>
              <Input
                value={element.settings?.className || ''}
                onChange={(e) => updateSetting('className', e.target.value)}
                placeholder="minha-classe"
              />
            </div>

            {/* Custom CSS */}
            <div className="space-y-2">
              <Label>CSS Personalizado</Label>
              <Textarea
                value={element.settings?.customCss || ''}
                onChange={(e) => updateSetting('customCss', e.target.value)}
                placeholder="border: 1px solid #ccc;"
                rows={3}
                className="font-mono text-sm"
              />
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
};
