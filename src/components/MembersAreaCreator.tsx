import { Card } from "@/components/ui/card";
import { Users, Lock, Video, Book, DollarSign, Play, Settings, Plus, Edit, Trash2 } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";

interface MembersArea {
  id: string;
  title: string;
  description: string;
  banner_url?: string;
  logo_url?: string;
  is_active: boolean;
  created_at: string;
}

interface Module {
  id: string;
  members_area_id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  is_free: boolean;
  price?: number;
  is_published: boolean;
}

export function MembersAreaCreator() {
  const [membersAreas, setMembersAreas] = useState<MembersArea[]>([]);
  const [selectedArea, setSelectedArea] = useState<MembersArea | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  });

  useEffect(() => {
    loadMembersAreas();
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
        .from('members_areas' as any)
        .insert([{
          user_id: user.id,
          title: formData.title,
          description: formData.description,
          banner_url: formData.banner_url,
          logo_url: formData.logo_url,
          is_active: true,
          settings: {}
        }]);

      if (error) throw error;

      toast.success("Área de membros criada!");
      setIsCreateDialogOpen(false);
      setFormData({ title: '', description: '', banner_url: '', logo_url: '' });
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

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-primary" />
            <div>
              <h2 className="text-2xl font-bold">Gerador de Área de Membros</h2>
              <p className="text-sm text-muted-foreground">
                Crie áreas de membros profissionais com cursos, módulos e pagamentos
              </p>
            </div>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary shadow-glow">
                <Plus className="mr-2 h-4 w-4" />
                Criar Área de Membros
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Área de Membros</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Título da Área</Label>
                  <Input 
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Ex: Meu Curso Online"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Descrição</Label>
                  <Textarea 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Descrição da sua área de membros..."
                    rows={3}
                  />
                </div>
                <ImageUpload 
                  label="Banner (opcional)"
                  onImageSelect={(url) => setFormData({...formData, banner_url: url})}
                  currentImage={formData.banner_url}
                />
                <ImageUpload 
                  label="Logo (opcional)"
                  onImageSelect={(url) => setFormData({...formData, logo_url: url})}
                  currentImage={formData.logo_url}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateArea} className="gradient-primary">
                  Criar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Carregando...</div>
        ) : membersAreas.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <Lock className="w-16 h-16 mx-auto text-muted-foreground" />
            <h3 className="text-xl font-semibold">Área de Membros</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Sistema completo para criar áreas de membros com módulos, aulas e conteúdos exclusivos. 
              Configure aprovação de membros, organize seu conteúdo em módulos e ofereça aulas demonstrativas gratuitas.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)} className="gradient-primary">
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeira Área
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {membersAreas.map((area) => (
              <Card key={area.id} className="hover:shadow-lg transition-smooth overflow-hidden">
                {area.banner_url && (
                  <div className="h-32 bg-gradient-to-br from-primary/20 to-primary/5 relative">
                    <img src={area.banner_url} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-4 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-1">{area.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {area.description}
                      </p>
                      <Badge variant={area.is_active ? 'default' : 'secondary'} className="mt-2">
                        {area.is_active ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => {
                        setSelectedArea(area);
                        loadModules(area.id);
                      }}
                    >
                      <Settings className="h-3 w-3 mr-1" />
                      Gerenciar
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteArea(area.id)}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      {/* Detalhes da Área Selecionada */}
      {selectedArea && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">{selectedArea.title}</h3>
            <Button variant="outline" onClick={() => setSelectedArea(null)}>
              Voltar
            </Button>
          </div>

          <Tabs defaultValue="modules">
            <TabsList>
              <TabsTrigger value="modules">
                <Book className="h-4 w-4 mr-2" />
                Módulos
              </TabsTrigger>
              <TabsTrigger value="students">
                <Users className="h-4 w-4 mr-2" />
                Alunos
              </TabsTrigger>
              <TabsTrigger value="payments">
                <DollarSign className="h-4 w-4 mr-2" />
                Pagamentos
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="h-4 w-4 mr-2" />
                Configurações
              </TabsTrigger>
            </TabsList>

            <TabsContent value="modules" className="space-y-4 pt-6">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold">Módulos e Cursos</h4>
                <Button className="gradient-primary" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Módulo
                </Button>
              </div>
              
              {modules.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <Video className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Nenhum módulo criado ainda</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {modules.map((module) => (
                    <Card key={module.id} className="p-4 hover:shadow-lg transition-smooth">
                      <div className="flex items-start gap-4">
                        {module.thumbnail_url ? (
                          <img src={module.thumbnail_url} alt="" className="w-20 h-20 object-cover rounded" />
                        ) : (
                          <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/5 rounded flex items-center justify-center">
                            <Play className="w-8 h-8 text-primary" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h5 className="font-semibold mb-1">{module.title}</h5>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {module.description}
                          </p>
                          <div className="flex gap-2 mt-2">
                            {module.is_free && <Badge variant="secondary">Grátis</Badge>}
                            {module.price && (
                              <Badge variant="outline">R$ {module.price.toFixed(2)}</Badge>
                            )}
                            <Badge variant={module.is_published ? 'default' : 'secondary'}>
                              {module.is_published ? 'Publicado' : 'Rascunho'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="students" className="pt-6">
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Funcionalidade de alunos em desenvolvimento</p>
              </div>
            </TabsContent>

            <TabsContent value="payments" className="pt-6">
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <DollarSign className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Funcionalidade de pagamentos em desenvolvimento</p>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="pt-6">
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label>Título</Label>
                  <Input value={selectedArea.title} disabled />
                </div>
                <div className="grid gap-2">
                  <Label>Descrição</Label>
                  <Textarea value={selectedArea.description} disabled rows={3} />
                </div>
                <p className="text-sm text-muted-foreground">
                  Mais configurações em breve...
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      )}
    </div>
  );
}
