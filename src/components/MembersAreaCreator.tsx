import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Lock, Video, Book, DollarSign, Play, Settings, Plus, Edit, Trash2, Copy, GraduationCap, List, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ImageUpload } from "@/components/ImageUpload";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ModuleEditor } from "@/components/members-area/ModuleEditor";
import { ProductsManager } from "@/components/members-area/ProductsManager";
import { EnrollmentsManager } from "@/components/members-area/EnrollmentsManager";
import { AccessRequestsManager } from "@/components/members-area/AccessRequestsManager";
import { ModuleContentsManager } from "@/components/members-area/ModuleContentsManager";
import { HomePageManager } from "@/components/members-area/HomePageManager";
import { MercadoPagoIntegration } from "@/components/admin/MercadoPagoIntegration";
import { HexColorPicker } from "react-colorful";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface MembersArea {
  id: string;
  title: string;
  description: string;
  area_type?: string;
  banner_url?: string;
  logo_url?: string;
  welcome_message?: string;
  is_active: boolean;
  created_at: string;
  custom_domain?: string;
  slug?: string;
  primary_color?: string;
  secondary_color?: string;
  products?: Array<{
    id: string;
    name: string;
    description: string;
    price: string;
    payment_link: string;
    image_url: string;
    modules_unlocked: string[];
  }>;
}

interface Module {
  id: string;
  members_area_id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  is_active: boolean;
  is_locked?: boolean;
  order_index?: number;
}

// Removido - agora focado apenas em cursos online

export function MembersAreaCreator() {
  const [membersAreas, setMembersAreas] = useState<MembersArea[]>([]);
  const [selectedArea, setSelectedArea] = useState<MembersArea | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<MembersArea | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    area_type: 'course',
    access_mode: 'open' // 'open' = liberada, 'restricted' = solicitar acesso
  });
  const [customDomains, setCustomDomains] = useState<Array<{id: string; domain: string; is_verified: boolean}>>([]);
  const [selectedDomain, setSelectedDomain] = useState<string>("");
  const [isModuleEditorOpen, setIsModuleEditorOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [selectedModuleForContents, setSelectedModuleForContents] = useState<Module | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [editedArea, setEditedArea] = useState<MembersArea | null>(null);
  const [showPrimaryColorPicker, setShowPrimaryColorPicker] = useState(false);
  const [showSecondaryColorPicker, setShowSecondaryColorPicker] = useState(false);

  useEffect(() => {
    loadMembersAreas();
    fetchCustomDomains();
  }, []);

  const loadMembersAreas = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('members_areas' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMembersAreas((data || []) as unknown as MembersArea[]);
    } catch (error: any) {
      toast.error(`Erro ao carregar áreas de membros: ${error?.message || ''}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomDomains = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('user_domains')
      .select('id, domain, is_verified')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    if (data) {
      setCustomDomains(data as any);
    }
  };

  useEffect(() => {
    if (selectedArea) {
      loadModules(selectedArea.id);
      loadProducts(selectedArea.id);
      setEditedArea(selectedArea);
      setHasUnsavedChanges(false);
    }
  }, [selectedArea]);

  const loadProducts = async (areaId: string) => {
    try {
      const { data, error } = await supabase
        .from('members_areas')
        .select('products')
        .eq('id', areaId)
        .single();

      if (error) throw error;
      setProducts(Array.isArray(data?.products) ? data.products : []);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
      setProducts([]);
    }
  };

  const handleSaveProducts = async (newProducts: any[]) => {
    if (!selectedArea) return;
    
    try {
      const { error } = await supabase
        .from('members_areas')
        .update({ products: newProducts })
        .eq('id', selectedArea.id);

      if (error) throw error;
      
      setProducts(newProducts);
      toast.success("Produtos salvos com sucesso!");
    } catch (error) {
      toast.error("Erro ao salvar produtos");
    }
  };

  const loadModules = async (areaId: string) => {
    try {
      const { data, error } = await supabase
        .from('members_area_modules' as any)
        .select('*')
        .eq('members_area_id', areaId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setModules((data || []) as unknown as Module[]);
    } catch (error: any) {
      toast.error("Erro ao carregar módulos");
    }
  };

  const handleCreateArea = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (!formData.title) {
        toast.error("Preencha o título");
        return;
      }

      const { error } = await supabase
        .from('members_areas')
        .insert([{
          user_id: user.id,
          name: formData.title,
          description: formData.description,
          area_type: (formData as any).area_type,
          require_approval: (formData as any).access_mode === 'restricted',
          is_active: true
        }]);

      if (error) throw error;

      toast.success("Área de membros criada!");
      setIsCreateDialogOpen(false);
      setFormData({ title: '', description: '', area_type: 'course', access_mode: 'open' });
      loadMembersAreas();
    } catch (error: any) {
      toast.error(`Erro ao criar área de membros: ${error?.message || ''}`);
    }
  };

  const handleDeleteArea = async (id: string) => {
    try {
      const { error } = await supabase
        .from('members_areas' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success("Área excluída!");
      loadMembersAreas();
    } catch (error: any) {
      toast.error("Erro ao excluir área");
    }
  };

  const handleOpenEditDialog = (area: MembersArea) => {
    setEditingArea(area);
    setFormData({
      title: (area as any).name || area.title,
      description: area.description || '',
      area_type: area.area_type || 'course',
      access_mode: (area as any).require_approval ? 'restricted' : 'open'
    } as any);
    setIsEditDialogOpen(true);
  };

  const handleUpdateArea = async () => {
    try {
      if (!editingArea) return;

      if (!formData.title) {
        toast.error("Preencha o título");
        return;
      }

      const { error } = await supabase
        .from('members_areas')
        .update({
          name: formData.title,
          description: formData.description,
          area_type: (formData as any).area_type,
          require_approval: (formData as any).access_mode === 'restricted',
        } as any)
        .eq('id', editingArea.id);

      if (error) throw error;

      toast.success("Curso atualizado com sucesso!");
      setIsEditDialogOpen(false);
      setEditingArea(null);
      setFormData({ title: '', description: '', area_type: 'course', access_mode: 'open' });
      loadMembersAreas();
      
      // Se estava editando a área selecionada, atualiza
      if (selectedArea?.id === editingArea.id) {
        setSelectedArea(null);
      }
    } catch (error: any) {
      toast.error(`Erro ao atualizar curso: ${error?.message || ''}`);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-br from-primary/5 via-background to-secondary/5 border-primary/20">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
              <GraduationCap className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Plataforma de Cursos Online
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Crie e gerencie seus cursos online profissionalmente
              </p>
            </div>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary shadow-glow">
                <Plus className="mr-2 h-4 w-4" />
                Criar Novo Curso
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-2xl flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Criar Novo Curso Online
                </DialogTitle>
                <p className="text-sm text-muted-foreground">
                  Configure seu curso e comece a criar módulos e aulas
                </p>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Nome do Curso</Label>
                  <Input 
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Ex: Dominando React do Zero ao Avançado"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Descrição</Label>
                  <Textarea 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Descreva o que os alunos vão aprender no seu curso..."
                    rows={4}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Tipo de Acesso</Label>
                  <Select 
                    value={(formData as any).access_mode} 
                    onValueChange={(value) => setFormData({...formData, access_mode: value} as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">
                        🌐 Área Liberada - Qualquer pessoa pode acessar
                      </SelectItem>
                      <SelectItem value="restricted">
                        🔒 Solicitar Acesso - Requer aprovação e código
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {(formData as any).access_mode === 'open' 
                      ? 'Qualquer pessoa com o link pode acessar o conteúdo sem precisar fazer login.'
                      : 'Usuários precisam solicitar acesso e você aprovará manualmente.'}
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateArea} className="gradient-primary">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Criar Curso
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* Dialog de Edição */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-2xl flex items-center gap-2">
                  <Edit className="w-5 h-5 text-primary" />
                  Editar Curso Online
                </DialogTitle>
                <p className="text-sm text-muted-foreground">
                  Atualize as informações do seu curso
                </p>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Nome do Curso</Label>
                  <Input 
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Ex: Dominando React do Zero ao Avançado"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Descrição</Label>
                  <Textarea 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Descreva o que os alunos vão aprender no seu curso..."
                    rows={4}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Tipo de Acesso</Label>
                  <Select 
                    value={(formData as any).access_mode} 
                    onValueChange={(value) => setFormData({...formData, access_mode: value} as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">
                        🌐 Área Liberada - Qualquer pessoa pode acessar
                      </SelectItem>
                      <SelectItem value="restricted">
                        🔒 Solicitar Acesso - Requer aprovação e código
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {(formData as any).access_mode === 'open' 
                      ? 'Qualquer pessoa com o link pode acessar o conteúdo sem precisar fazer login.'
                      : 'Usuários precisam solicitar acesso e você aprovará manualmente.'}
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditingArea(null);
                  setFormData({ title: '', description: '', area_type: 'course', access_mode: 'open' });
                }}>
                  Cancelar
                </Button>
                <Button onClick={handleUpdateArea} className="gradient-primary">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Salvar Alterações
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Carregando...</div>
        ) : membersAreas.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4">
              <GraduationCap className="w-12 h-12 text-primary" />
            </div>
            <h3 className="text-2xl font-bold">Comece Sua Plataforma de Cursos</h3>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Crie cursos online profissionais com módulos, aulas em vídeo, controle de acesso e pagamentos integrados.
              Tudo o que você precisa para monetizar seu conhecimento.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
              <Button onClick={() => setIsCreateDialogOpen(true)} className="gradient-primary shadow-glow">
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeiro Curso
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {membersAreas.map((area) => (
              <Card key={area.id} className="group hover:shadow-xl transition-all duration-300 overflow-hidden border-primary/10 hover:border-primary/30">
                <div className="relative h-48 bg-gradient-to-br from-primary/20 to-primary/5">
                  {area.banner_url ? (
                    <img src={area.banner_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Video className="w-16 h-16 text-primary/40" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  <Badge 
                    variant={area.is_active ? 'default' : 'secondary'} 
                    className="absolute top-3 right-3"
                  >
                    {area.is_active ? '🟢 Publicado' : '⚪ Rascunho'}
                  </Badge>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <h3 className="font-bold text-xl mb-2 line-clamp-1">
                      {(area as any).name || area.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                      {area.description || 'Sem descrição'}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button 
                      className="w-full gradient-primary shadow-glow"
                      size="sm"
                      onClick={() => {
                        setSelectedArea(area);
                        loadModules(area.id);
                      }}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Gerenciar Curso
                    </Button>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1"
                        onClick={() => handleOpenEditDialog(area)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          const customDomain = (area as any).custom_domain;
                          const slug = (area as any).slug || area.id;
                          
                          let link;
                          if (customDomain && customDomain.includes('.')) {
                            link = `https://${customDomain}/${slug}`;
                          } else {
                            link = `${window.location.origin}/members-area/${area.id}`;
                          }
                          
                          navigator.clipboard.writeText(link);
                          toast.success("Link copiado!");
                        }}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Link
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          const customDomain = (area as any).custom_domain;
                          const slug = (area as any).slug || area.id;
                          
                          if (customDomain && customDomain.includes('.')) {
                            window.open(`https://${customDomain}/${slug}`, '_blank');
                          } else {
                            window.open(`/members-area/${area.id}`, '_blank');
                          }
                        }}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteArea(area.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      {/* Detalhes do Curso Selecionado */}
      {selectedArea && (
        <Card className="p-6 border-primary/20">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <GraduationCap className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">{(selectedArea as any).name || selectedArea.title}</h3>
                <p className="text-sm text-muted-foreground">
                  Gerencie módulos, aulas, alunos e pagamentos do seu curso
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {hasUnsavedChanges && (
                <Button 
                  className="gradient-primary"
                  onClick={async () => {
                    if (!editedArea) return;
                    const { error } = await supabase
                      .from('members_areas')
                      .update({
                        banner_url: editedArea.banner_url,
                        logo_url: editedArea.logo_url,
                        custom_domain: editedArea.custom_domain,
                        slug: editedArea.slug || null,
                        primary_color: editedArea.primary_color,
                        secondary_color: editedArea.secondary_color,
                      } as any)
                      .eq('id', editedArea.id);
                    if (!error) {
                      toast.success('Alterações salvas!');
                      setSelectedArea(editedArea);
                      setHasUnsavedChanges(false);
                      loadMembersAreas();
                    }
                  }}
                >
                  Salvar
                </Button>
              )}
              <Button 
                variant={selectedArea.is_active ? "outline" : "default"}
                className={!selectedArea.is_active ? "gradient-primary" : ""}
                onClick={async () => {
                  const { error } = await supabase
                    .from('members_areas')
                    .update({ is_active: !selectedArea.is_active } as any)
                    .eq('id', selectedArea.id);
                  if (!error) {
                    toast.success(selectedArea.is_active ? 'Área despublicada!' : 'Área publicada!');
                    setSelectedArea({...selectedArea, is_active: !selectedArea.is_active});
                    loadMembersAreas();
                  }
                }}
              >
                {selectedArea.is_active ? 'Despublicar' : 'Publicar Área'}
              </Button>
              <Button variant="outline" onClick={() => setSelectedArea(null)}>
                Voltar
              </Button>
            </div>
          </div>

          <Tabs defaultValue="homepage" className="mt-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="homepage">
                <Play className="h-4 w-4 mr-2" />
                Início
              </TabsTrigger>
              <TabsTrigger value="modules">
                <Video className="h-4 w-4 mr-2" />
                Módulos & Aulas
              </TabsTrigger>
              <TabsTrigger value="access">
                <Lock className="h-4 w-4 mr-2" />
                Solicitações
              </TabsTrigger>
              <TabsTrigger value="students">
                <Users className="h-4 w-4 mr-2" />
                Alunos
              </TabsTrigger>
              <TabsTrigger value="payments">
                <DollarSign className="h-4 w-4 mr-2" />
                Checkout
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="h-4 w-4 mr-2" />
                Configurações
              </TabsTrigger>
            </TabsList>

            <TabsContent value="homepage" className="pt-6">
              <HomePageManager 
                areaId={selectedArea.id}
                availableModules={modules.map(m => ({ id: m.id, title: m.title }))}
              />
            </TabsContent>

            <TabsContent value="modules" className="space-y-4 pt-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h4 className="text-lg font-bold">Módulos & Aulas do Curso</h4>
                  <p className="text-sm text-muted-foreground">Organize o conteúdo do seu curso em módulos</p>
                </div>
                <Button 
                  className="gradient-primary shadow-glow" 
                  size="sm"
                  onClick={() => {
                    setEditingModule(null);
                    setIsModuleEditorOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Módulo
                </Button>
              </div>
              
              {modules.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed rounded-xl bg-muted/30">
                  <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Video className="w-10 h-10 text-primary" />
                  </div>
                  <h5 className="text-lg font-semibold mb-2">Crie seu primeiro módulo</h5>
                  <p className="text-sm text-muted-foreground mb-4">Organize as aulas do curso em módulos temáticos</p>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setEditingModule(null);
                      setIsModuleEditorOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Módulo
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {modules.map((module, index) => (
                  <Card key={module.id} className="group hover:shadow-xl transition-all duration-300 overflow-hidden border-primary/10 hover:border-primary/30">
                      <div className="flex items-start gap-4 p-5">
                        <div className="relative">
                          <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg flex items-center justify-center">
                            {module.thumbnail_url ? (
                              <img src={module.thumbnail_url} alt={module.title} className="w-full h-full object-cover rounded-lg" />
                            ) : (
                              <Video className="w-8 h-8 text-primary" />
                            )}
                          </div>
                          <div className="absolute -top-2 -left-2 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </div>
                        </div>
                         <div className="flex-1">
                          <h5 className="font-bold text-base mb-1 line-clamp-1">{module.title}</h5>
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                            {module.description || 'Sem descrição'}
                          </p>
                          <div className="flex gap-1.5 mb-3 flex-wrap">
                            {module.is_locked && <Badge variant="secondary" className="text-xs">🔒 Bloqueado</Badge>}
                            <Badge variant={module.is_active ? 'default' : 'secondary'} className="text-xs">
                              {module.is_active ? '✓ Ativo' : '◯ Inativo'}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="text-xs h-8"
                              onClick={() => setSelectedModuleForContents(module)}
                            >
                              <List className="h-3 w-3 mr-1" />
                              Aulas
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="text-xs h-8"
                              onClick={() => {
                                setEditingModule(module);
                                setIsModuleEditorOpen(true);
                              }}
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Editar
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="text-xs h-8"
                              onClick={async () => {
                                if (confirm('Deseja realmente excluir este módulo?')) {
                                  const { error } = await supabase
                                    .from('members_area_modules')
                                    .delete()
                                    .eq('id', module.id);
                                  if (!error) {
                                    toast.success('Módulo excluído');
                                    loadModules(selectedArea.id);
                                  }
                                }
                              }}
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Removido - produtos não são mais necessários nesta versão focada em cursos */}

            <TabsContent value="access" className="pt-6">
              <div className="mb-4">
                <h4 className="text-lg font-bold mb-1">Solicitações de Acesso</h4>
                <p className="text-sm text-muted-foreground">Gerencie quem pode acessar seu curso</p>
              </div>
              <AccessRequestsManager areaId={selectedArea.id} />
            </TabsContent>

            <TabsContent value="students" className="pt-6">
              <div className="mb-4">
                <h4 className="text-lg font-bold mb-1">Alunos Matriculados</h4>
                <p className="text-sm text-muted-foreground">Veja todos os alunos com acesso ao curso</p>
              </div>
              <EnrollmentsManager areaId={selectedArea.id} />
            </TabsContent>

            {/* Removido - tabs específicas não são necessárias */}


            <TabsContent value="payments" className="pt-6 space-y-6">
              <div className="mb-4">
                <h4 className="text-lg font-bold mb-1">Checkout & Pagamentos</h4>
                <p className="text-sm text-muted-foreground">Configure como seus alunos vão pagar pelo curso</p>
              </div>
              
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-primary" />
                    Integração Mercado Pago
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Receba pagamentos automaticamente e libere o acesso ao curso após confirmação
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Access Token do Mercado Pago</Label>
                    <Input 
                      type="password"
                      placeholder="APP_USR-..."
                      onChange={async (e) => {
                        if (!selectedArea) return;
                        const { error } = await supabase
                          .from('members_areas')
                          .update({ 
                            payment_config: { 
                              mercadopago_token: e.target.value 
                            } 
                          } as any)
                          .eq('id', selectedArea.id);
                        if (!error) {
                          toast.success('Token salvo!');
                        }
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      Encontre em: Mercado Pago → Seu negócio → Credenciais → Access Token de produção
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Public Key do Mercado Pago</Label>
                    <Input 
                      placeholder="APP_USR-..."
                      onChange={async (e) => {
                        if (!selectedArea) return;
                        const { error } = await supabase
                          .from('members_areas')
                          .update({ 
                            payment_config: { 
                              mercadopago_public_key: e.target.value 
                            } 
                          } as any)
                          .eq('id', selectedArea.id);
                        if (!error) {
                          toast.success('Public Key salva!');
                        }
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      Encontre em: Mercado Pago → Seu negócio → Credenciais → Public Key de produção
                    </p>
                  </div>

                  <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                    <h4 className="font-semibold mb-2 text-sm">💡 Como funciona:</h4>
                    <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                      <li>Configure suas credenciais do Mercado Pago aqui</li>
                      <li>Os alunos verão a opção de pagamento ao acessar módulos pagos</li>
                      <li>Após confirmação do pagamento, o acesso será liberado automaticamente</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Copy className="w-5 h-5 text-primary" />
                    Link de Pagamento Externo
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Use plataformas como Hotmart, Eduzz ou qualquer outro checkout
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Link de Pagamento Externo</Label>
                    <Input 
                      placeholder="https://link-de-pagamento.com"
                      onChange={async (e) => {
                        if (!selectedArea) return;
                        const { error } = await supabase
                          .from('members_areas')
                          .update({ 
                            payment_config: { 
                              external_payment_link: e.target.value 
                            } 
                          } as any)
                          .eq('id', selectedArea.id);
                        if (!error) {
                          toast.success('Link salvo!');
                        }
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      Use links do Mercado Pago, Hotmart, Stripe ou qualquer outro processador
                    </p>
                  </div>

                  <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                    <h4 className="font-semibold mb-2 text-sm">📋 Opções de pagamento:</h4>
                    <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                      <li>Configure módulos como pagos na edição do módulo</li>
                      <li>Defina preços individuais para cada módulo</li>
                      <li>Alunos podem comprar acesso aos módulos pagos</li>
                      <li>Liberação automática após confirmação do pagamento</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="pt-6">
              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Informações Básicas</h4>
                  <div className="grid gap-2">
                    <Label>Título</Label>
                    <Input value={(selectedArea as any).name || selectedArea.title} disabled />
                  </div>
                  <div className="grid gap-2">
                    <Label>Descrição</Label>
                    <Textarea value={selectedArea.description} disabled rows={3} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Banner</Label>
                    <ImageUpload
                      currentImage={editedArea?.banner_url || selectedArea.banner_url || ''}
                      onImageSelect={(url) => {
                        setEditedArea({...selectedArea, banner_url: url});
                        setHasUnsavedChanges(true);
                      }}
                      bucketName="members-content"
                      label="Banner"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Logo</Label>
                    <ImageUpload
                      currentImage={editedArea?.logo_url || selectedArea.logo_url || ''}
                      onImageSelect={(url) => {
                        setEditedArea({...selectedArea, logo_url: url});
                        setHasUnsavedChanges(true);
                      }}
                      bucketName="members-content"
                      label="Logo"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Cores da Área de Membros</h4>
                  <p className="text-sm text-muted-foreground">Personalize as cores primária e secundária da sua área de membros</p>
                  
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label>Cor Primária</Label>
                      <Popover open={showPrimaryColorPicker} onOpenChange={setShowPrimaryColorPicker}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start gap-2"
                          >
                            <div 
                              className="w-6 h-6 rounded border border-border" 
                              style={{ backgroundColor: editedArea?.primary_color || selectedArea.primary_color || '#8B5CF6' }}
                            />
                            <span>{editedArea?.primary_color || selectedArea.primary_color || '#8B5CF6'}</span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-3">
                          <HexColorPicker
                            color={editedArea?.primary_color || selectedArea.primary_color || '#8B5CF6'}
                            onChange={(color) => {
                              setEditedArea({...(editedArea || selectedArea), primary_color: color});
                              setHasUnsavedChanges(true);
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                      <p className="text-xs text-muted-foreground">Cor principal (botões, destaques)</p>
                    </div>

                    <div className="grid gap-2">
                      <Label>Cor Secundária</Label>
                      <Popover open={showSecondaryColorPicker} onOpenChange={setShowSecondaryColorPicker}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start gap-2"
                          >
                            <div 
                              className="w-6 h-6 rounded border border-border" 
                              style={{ backgroundColor: editedArea?.secondary_color || selectedArea.secondary_color || '#EC4899' }}
                            />
                            <span>{editedArea?.secondary_color || selectedArea.secondary_color || '#EC4899'}</span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-3">
                          <HexColorPicker
                            color={editedArea?.secondary_color || selectedArea.secondary_color || '#EC4899'}
                            onChange={(color) => {
                              setEditedArea({...(editedArea || selectedArea), secondary_color: color});
                              setHasUnsavedChanges(true);
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                      <p className="text-xs text-muted-foreground">Cor secundária (acentos, detalhes)</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Domínio Customizado</h4>
                  <div className="grid gap-2">
                    <Label>Selecione um domínio</Label>
                    <Select 
                      value={editedArea?.custom_domain || selectedArea.custom_domain || 'none'}
                      onValueChange={(value) => {
                        setEditedArea({...selectedArea, custom_domain: value === 'none' ? undefined : value});
                        setHasUnsavedChanges(true);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Nenhum domínio selecionado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        {customDomains.filter(d => d.is_verified).map(domain => (
                          <SelectItem key={domain.id} value={domain.domain}>
                            {domain.domain}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {customDomains.filter(d => d.is_verified).length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        Nenhum domínio verificado. Adicione um domínio em "Meus Domínios".
                      </p>
                    )}
                  </div>
                  
                  {(editedArea?.custom_domain || selectedArea.custom_domain) && (
                    <div className="grid gap-2">
                      <Label>Slug da Área (opcional)</Label>
                      <Input
                        value={editedArea?.slug || selectedArea.slug || ''}
                        onChange={(e) => {
                          const slug = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                          setEditedArea({...(editedArea || selectedArea), slug});
                          setHasUnsavedChanges(true);
                        }}
                        placeholder="minha-area"
                        maxLength={50}
                      />
                      <p className="text-xs text-muted-foreground">
                        Use apenas letras minúsculas, números e hífens. Deixe em branco para usar o ID.
                      </p>
                      {(editedArea?.slug || selectedArea.slug) ? (
                        <p className="text-sm text-primary">
                          Área acessível em: https://{editedArea?.custom_domain || selectedArea.custom_domain}/members/{editedArea?.slug || selectedArea.slug}
                        </p>
                      ) : selectedArea.custom_domain && (
                        <p className="text-sm text-primary">
                          Área acessível em: https://{selectedArea.custom_domain}/members/{selectedArea.id}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      )}

      <ModuleEditor
        open={isModuleEditorOpen}
        onOpenChange={setIsModuleEditorOpen}
        areaId={selectedArea?.id || ''}
        module={editingModule as any}
        onSave={() => {
          if (selectedArea) {
            loadModules(selectedArea.id);
          }
        }}
      />

      {selectedModuleForContents && (
        <Dialog open={!!selectedModuleForContents} onOpenChange={() => setSelectedModuleForContents(null)}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Gerenciar Conteúdos</DialogTitle>
            </DialogHeader>
            <ModuleContentsManager 
              moduleId={selectedModuleForContents.id}
              moduleName={selectedModuleForContents.title}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
