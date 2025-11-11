import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageUpload } from "@/components/ImageUpload";
import { 
  Save, 
  Eye, 
  Settings, 
  Layout, 
  Palette, 
  Type, 
  Image as ImageIcon,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Monitor,
  Menu,
  ShoppingBag
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PreviewSection } from "./PreviewSection";
import { HeaderEditor } from "./HeaderEditor";
import { FooterEditor } from "./FooterEditor";
import { ProductsEditor } from "./ProductsEditor";

interface Section {
  id: string;
  type: 'hero' | 'about' | 'services' | 'testimonials' | 'gallery' | 'contact' | 'cta' | 'features';
  content: any;
  order: number;
}

interface Website {
  id: string;
  title: string;
  slug: string;
  description?: string;
  site_type?: string;
  settings: {
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
    logo?: string;
  };
  header?: {
    show_logo: boolean;
    menu_items: Array<{ label: string; link: string }>;
    cta_button: { text: string; link: string };
  };
  footer?: {
    copyright: string;
    social_links: Array<{ platform: string; url: string }>;
    columns: Array<{ title: string; links: Array<{ label: string; url: string }> }>;
  };
  products?: Array<{
    id: string;
    name: string;
    description: string;
    price: string;
    payment_link: string;
    image_url: string;
    category: string;
  }>;
  sections: Section[];
  is_published: boolean;
}

interface WebsiteEditorProps {
  website: Website;
  onClose: () => void;
  onUpdate: () => void;
}

const sectionTypes = [
  { value: 'hero', label: 'Hero / Banner', icon: Layout },
  { value: 'about', label: 'Sobre', icon: Type },
  { value: 'services', label: 'Serviços/Produtos', icon: Layout },
  { value: 'features', label: 'Recursos', icon: Layout },
  { value: 'testimonials', label: 'Depoimentos', icon: Type },
  { value: 'gallery', label: 'Galeria', icon: ImageIcon },
  { value: 'contact', label: 'Contato', icon: Type },
  { value: 'cta', label: 'Chamada para Ação', icon: Layout }
];

export function WebsiteEditor({ website, onClose, onUpdate }: WebsiteEditorProps) {
  const [sections, setSections] = useState<Section[]>(website.sections || []);
  const [settings, setSettings] = useState(website.settings);
  const [header, setHeader] = useState(website.header || { show_logo: true, menu_items: [], cta_button: { text: '', link: '' } });
  const [footer, setFooter] = useState(website.footer || { copyright: '', social_links: [], columns: [] });
  const [products, setProducts] = useState(website.products || []);
  const [saving, setSaving] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  const addSection = (type: Section['type']) => {
    const newSection: Section = {
      id: `section-${Date.now()}`,
      type,
      order: sections.length,
      content: getDefaultContent(type)
    };
    setSections([...sections, newSection]);
    setSelectedSection(newSection.id);
  };

  const getDefaultContent = (type: Section['type']) => {
    switch (type) {
      case 'hero':
        return { 
          title: 'Bem-vindo ao Nosso Site', 
          subtitle: 'Texto de destaque aqui',
          buttonText: 'Saiba Mais',
          buttonLink: '#',
          backgroundImage: ''
        };
      case 'about':
        return { 
          title: 'Sobre Nós', 
          content: 'Conte sua história aqui...',
          image: ''
        };
      case 'services':
        return { 
          title: 'Nossos Serviços',
          items: [
            { title: 'Serviço 1', description: 'Descrição do serviço', icon: '' },
            { title: 'Serviço 2', description: 'Descrição do serviço', icon: '' },
            { title: 'Serviço 3', description: 'Descrição do serviço', icon: '' }
          ]
        };
      case 'features':
        return { 
          title: 'Recursos',
          items: [
            { title: 'Recurso 1', description: 'Descrição', icon: '' },
            { title: 'Recurso 2', description: 'Descrição', icon: '' }
          ]
        };
      case 'testimonials':
        return { 
          title: 'Depoimentos',
          items: [
            { name: 'Cliente 1', text: 'Excelente serviço!', avatar: '' },
            { name: 'Cliente 2', text: 'Recomendo muito!', avatar: '' }
          ]
        };
      case 'gallery':
        return { 
          title: 'Galeria',
          images: []
        };
      case 'contact':
        return { 
          title: 'Entre em Contato',
          email: 'contato@exemplo.com',
          phone: '(00) 0000-0000',
          address: 'Endereço completo'
        };
      case 'cta':
        return { 
          title: 'Pronto para começar?',
          buttonText: 'Começar Agora',
          buttonLink: '#'
        };
      default:
        return {};
    }
  };

  const updateSection = (id: string, content: any) => {
    setSections(sections.map(s => s.id === id ? { ...s, content } : s));
  };

  const removeSection = (id: string) => {
    setSections(sections.filter(s => s.id !== id));
    if (selectedSection === id) setSelectedSection(null);
  };

  const moveSection = (id: string, direction: 'up' | 'down') => {
    const index = sections.findIndex(s => s.id === id);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === sections.length - 1) return;

    const newSections = [...sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
    
    newSections.forEach((s, i) => s.order = i);
    setSections(newSections);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('websites')
        .update({
          settings,
          header,
          footer,
          products,
          sections: sections as any,
          updated_at: new Date().toISOString()
        })
        .eq('id', website.id);

      if (error) throw error;
      toast.success("Site salvo com sucesso!");
      onUpdate();
    } catch (error) {
      toast.error("Erro ao salvar site");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    await handleSave();
    try {
      const { error } = await supabase
        .from('websites')
        .update({ is_published: true })
        .eq('id', website.id);

      if (error) throw error;
      toast.success("Site publicado!");
      onUpdate();
    } catch (error) {
      toast.error("Erro ao publicar site");
    }
  };

  const selectedSectionData = sections.find(s => s.id === selectedSection);

  const [showPreview, setShowPreview] = useState(true);

  return (
    <div className="fixed inset-0 bg-background z-50 overflow-hidden flex flex-col">
      <div className="bg-background border-b z-10 p-4 flex-shrink-0">
        <div className="flex items-center justify-between max-w-full mx-auto">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onClose}>← Voltar</Button>
            <div>
              <h2 className="text-xl font-bold">{website.title}</h2>
              <p className="text-sm text-muted-foreground">Editando site</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant={showPreview ? "default" : "outline"} 
              onClick={() => setShowPreview(!showPreview)}
            >
              <Eye className="mr-2 h-4 w-4" />
              {showPreview ? "Ocultar" : "Mostrar"} Preview
            </Button>
            <Button variant="outline" onClick={() => window.open(`/site/${website.slug}`, '_blank')}>
              <Eye className="mr-2 h-4 w-4" />
              Abrir em nova aba
            </Button>
            <Button variant="outline" onClick={handleSave} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
            <Button className="gradient-primary" onClick={handlePublish}>
              Publicar Site
            </Button>
          </div>
        </div>
      </div>

      <div className={`flex-1 overflow-hidden ${showPreview ? 'grid grid-cols-2' : 'flex'} gap-1`}>
        {/* Editor Panel */}
        <div className="overflow-auto p-6 bg-muted/30">
          <div className="max-w-3xl mx-auto space-y-4">
          {/* Configurações e Seções */}
          <div className="lg:col-span-1 space-y-4">
            <Tabs defaultValue="sections">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="sections">Seções</TabsTrigger>
                <TabsTrigger value="header">Header</TabsTrigger>
                <TabsTrigger value="footer">Footer</TabsTrigger>
                <TabsTrigger value="products">Produtos</TabsTrigger>
                <TabsTrigger value="settings">Config</TabsTrigger>
              </TabsList>

              <TabsContent value="sections" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Adicionar Seção</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {sectionTypes.map(type => (
                      <Button
                        key={type.value}
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => addSection(type.value as Section['type'])}
                      >
                        <type.icon className="mr-2 h-4 w-4" />
                        {type.label}
                      </Button>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Seções do Site</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {sections.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhuma seção adicionada
                      </p>
                    ) : (
                      sections.map((section, index) => (
                        <div
                          key={section.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedSection === section.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                          }`}
                          onClick={() => setSelectedSection(section.id)}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium capitalize">{section.type}</span>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => { e.stopPropagation(); moveSection(section.id, 'up'); }}
                                disabled={index === 0}
                              >
                                <ArrowUp className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => { e.stopPropagation(); moveSection(section.id, 'down'); }}
                                disabled={index === sections.length - 1}
                              >
                                <ArrowDown className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-destructive"
                                onClick={(e) => { e.stopPropagation(); removeSection(section.id); }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="header">
                <HeaderEditor config={header} onUpdate={setHeader} />
              </TabsContent>

              <TabsContent value="footer">
                <FooterEditor config={footer} onUpdate={setFooter} />
              </TabsContent>

              <TabsContent value="products">
                <ProductsEditor products={products} onUpdate={setProducts} />
              </TabsContent>

              <TabsContent value="settings">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Aparência</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Cor Primária</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={settings.primaryColor || '#8B5CF6'}
                          onChange={(e) => setSettings({...settings, primaryColor: e.target.value})}
                          className="w-20 h-10"
                        />
                        <Input
                          value={settings.primaryColor || '#8B5CF6'}
                          onChange={(e) => setSettings({...settings, primaryColor: e.target.value})}
                          placeholder="#8B5CF6"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Cor Secundária</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={settings.secondaryColor || '#EC4899'}
                          onChange={(e) => setSettings({...settings, secondaryColor: e.target.value})}
                          className="w-20 h-10"
                        />
                        <Input
                          value={settings.secondaryColor || '#EC4899'}
                          onChange={(e) => setSettings({...settings, secondaryColor: e.target.value})}
                          placeholder="#EC4899"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Fonte</Label>
                      <Select
                        value={settings.fontFamily || 'Inter'}
                        onValueChange={(value) => setSettings({...settings, fontFamily: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Inter">Inter</SelectItem>
                          <SelectItem value="Roboto">Roboto</SelectItem>
                          <SelectItem value="Poppins">Poppins</SelectItem>
                          <SelectItem value="Montserrat">Montserrat</SelectItem>
                          <SelectItem value="Open Sans">Open Sans</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Logo</Label>
                      <ImageUpload
                        currentImage={settings.logo}
                        onImageSelect={(url) => setSettings({...settings, logo: url})}
                        bucketName="chatbot-media"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

            {selectedSectionData ? (
              <SectionEditor
                section={selectedSectionData}
                onUpdate={(content) => updateSection(selectedSectionData.id, content)}
              />
            ) : (
              <Card className="h-full flex items-center justify-center">
                <CardContent className="text-center py-12">
                  <Layout className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Selecione uma seção para editar
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Live Preview Panel */}
        {showPreview && (
          <div className="overflow-auto bg-background border-l">
            <div className="sticky top-0 bg-muted/50 px-4 py-2 border-b flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Preview em tempo real</span>
              <div className="flex gap-1">
                <Button 
                  size="sm" 
                  variant={previewMode === 'desktop' ? 'default' : 'ghost'}
                  onClick={() => setPreviewMode('desktop')}
                >
                  <Monitor className="h-4 w-4 mr-1" />
                  Desktop
                </Button>
                <Button 
                  size="sm" 
                  variant={previewMode === 'tablet' ? 'default' : 'ghost'}
                  onClick={() => setPreviewMode('tablet')}
                >
                  <Layout className="h-4 w-4 mr-1" />
                  Tablet
                </Button>
                <Button 
                  size="sm" 
                  variant={previewMode === 'mobile' ? 'default' : 'ghost'}
                  onClick={() => setPreviewMode('mobile')}
                >
                  <Type className="h-4 w-4 mr-1" />
                  Mobile
                </Button>
              </div>
            </div>
            <div className="p-6 flex justify-center">
              <div 
                className={`bg-white rounded-lg shadow-lg overflow-hidden transition-all ${
                  previewMode === 'mobile' ? 'max-w-[375px]' : 
                  previewMode === 'tablet' ? 'max-w-[768px]' : 
                  'w-full'
                }`}
                style={{
                  fontFamily: settings.fontFamily || 'Inter',
                  '--primary-color': settings.primaryColor || '#8B5CF6',
                  '--secondary-color': settings.secondaryColor || '#EC4899'
                } as React.CSSProperties}
              >
                {sections.map((section) => (
                  <PreviewSection 
                    key={section.id} 
                    section={section} 
                    settings={settings}
                  />
                ))}
                {sections.length === 0 && (
                  <div className="text-center py-20 text-muted-foreground">
                    <Layout className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Adicione seções para ver o preview</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SectionEditor({ section, onUpdate }: { section: Section; onUpdate: (content: any) => void }) {
  const { content } = section;

  const updateField = (field: string, value: any) => {
    onUpdate({ ...content, [field]: value });
  };

  const updateArrayItem = (index: number, field: string, value: any) => {
    const items = [...content.items];
    items[index] = { ...items[index], [field]: value };
    onUpdate({ ...content, items });
  };

  const addArrayItem = (defaultItem: any) => {
    onUpdate({ ...content, items: [...(content.items || []), defaultItem] });
  };

  const removeArrayItem = (index: number) => {
    const items = content.items.filter((_: any, i: number) => i !== index);
    onUpdate({ ...content, items });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="capitalize">Editar {section.type}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {section.type === 'hero' && (
          <>
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                value={content.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="Título principal"
              />
            </div>
            <div className="space-y-2">
              <Label>Subtítulo</Label>
              <Textarea
                value={content.subtitle}
                onChange={(e) => updateField('subtitle', e.target.value)}
                placeholder="Texto de destaque"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Texto do Botão</Label>
              <Input
                value={content.buttonText}
                onChange={(e) => updateField('buttonText', e.target.value)}
                placeholder="Ex: Saiba Mais"
              />
            </div>
            <div className="space-y-2">
              <Label>Link do Botão</Label>
              <Input
                value={content.buttonLink}
                onChange={(e) => updateField('buttonLink', e.target.value)}
                placeholder="Ex: #contato"
              />
            </div>
            <div className="space-y-2">
              <Label>Imagem de Fundo</Label>
              <ImageUpload
                currentImage={content.backgroundImage}
                onImageSelect={(url) => updateField('backgroundImage', url)}
                bucketName="chatbot-media"
              />
            </div>
          </>
        )}

        {section.type === 'about' && (
          <>
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                value={content.title}
                onChange={(e) => updateField('title', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Conteúdo</Label>
              <Textarea
                value={content.content}
                onChange={(e) => updateField('content', e.target.value)}
                rows={6}
              />
            </div>
            <div className="space-y-2">
              <Label>Imagem</Label>
              <ImageUpload
                currentImage={content.image}
                onImageSelect={(url) => updateField('image', url)}
                bucketName="chatbot-media"
              />
            </div>
          </>
        )}

        {(section.type === 'services' || section.type === 'features') && (
          <>
            <div className="space-y-2">
              <Label>Título da Seção</Label>
              <Input
                value={content.title}
                onChange={(e) => updateField('title', e.target.value)}
              />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Itens</Label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addArrayItem({ title: '', description: '', icon: '' })}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Item
                </Button>
              </div>
              {content.items?.map((item: any, index: number) => (
                <Card key={index} className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label>Item {index + 1}</Label>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeArrayItem(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    <Input
                      placeholder="Título"
                      value={item.title}
                      onChange={(e) => updateArrayItem(index, 'title', e.target.value)}
                    />
                    <Textarea
                      placeholder="Descrição"
                      value={item.description}
                      onChange={(e) => updateArrayItem(index, 'description', e.target.value)}
                      rows={2}
                    />
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}

        {section.type === 'testimonials' && (
          <>
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                value={content.title}
                onChange={(e) => updateField('title', e.target.value)}
              />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Depoimentos</Label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addArrayItem({ name: '', text: '', avatar: '' })}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar
                </Button>
              </div>
              {content.items?.map((item: any, index: number) => (
                <Card key={index} className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label>Depoimento {index + 1}</Label>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeArrayItem(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    <Input
                      placeholder="Nome do cliente"
                      value={item.name}
                      onChange={(e) => updateArrayItem(index, 'name', e.target.value)}
                    />
                    <Textarea
                      placeholder="Depoimento"
                      value={item.text}
                      onChange={(e) => updateArrayItem(index, 'text', e.target.value)}
                      rows={3}
                    />
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}

        {section.type === 'contact' && (
          <>
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                value={content.title}
                onChange={(e) => updateField('title', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={content.email}
                onChange={(e) => updateField('email', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input
                value={content.phone}
                onChange={(e) => updateField('phone', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Endereço</Label>
              <Textarea
                value={content.address}
                onChange={(e) => updateField('address', e.target.value)}
                rows={2}
              />
            </div>
          </>
        )}

        {section.type === 'cta' && (
          <>
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                value={content.title}
                onChange={(e) => updateField('title', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Texto do Botão</Label>
              <Input
                value={content.buttonText}
                onChange={(e) => updateField('buttonText', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Link do Botão</Label>
              <Input
                value={content.buttonLink}
                onChange={(e) => updateField('buttonLink', e.target.value)}
              />
            </div>
          </>
        )}

        {section.type === 'gallery' && (
          <>
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                value={content.title}
                onChange={(e) => updateField('title', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Imagens da Galeria</Label>
              <p className="text-sm text-muted-foreground">Adicione múltiplas imagens</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
