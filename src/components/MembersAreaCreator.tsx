import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Edit, Save, Users, Lock, FileText, Video, Image as ImageIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface MembersArea {
  id: string;
  name: string;
  description: string;
  logo_url?: string;
  primary_color: string;
  is_active: boolean;
  requires_approval: boolean;
}

interface Module {
  id: string;
  area_id: string;
  title: string;
  description?: string;
  order_index: number;
  is_published: boolean;
}

interface Content {
  id: string;
  module_id: string;
  title: string;
  content_type: 'text' | 'video' | 'pdf' | 'image';
  content_url?: string;
  content_text?: string;
  order_index: number;
  is_free: boolean;
}

export function MembersAreaCreator() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [areas, setAreas] = useState<MembersArea[]>([]);
  const [selectedArea, setSelectedArea] = useState<MembersArea | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(false);

  // Form states
  const [areaForm, setAreaForm] = useState({
    name: "",
    description: "",
    logo_url: "",
    primary_color: "#6366f1",
    requires_approval: false,
  });

  const [moduleForm, setModuleForm] = useState({
    title: "",
    description: "",
  });

  const [contentForm, setContentForm] = useState({
    title: "",
    content_type: "text" as Content['content_type'],
    content_url: "",
    content_text: "",
    is_free: false,
  });

  useEffect(() => {
    fetchAreas();
  }, [user]);

  useEffect(() => {
    if (selectedArea) {
      fetchModules(selectedArea.id);
    }
  }, [selectedArea]);

  useEffect(() => {
    if (selectedModule) {
      fetchContents(selectedModule.id);
    }
  }, [selectedModule]);

  const fetchAreas = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('members_areas')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setAreas(data);
    }
  };

  const fetchModules = async (areaId: string) => {
    const { data, error } = await supabase
      .from('members_modules')
      .select('*')
      .eq('area_id', areaId)
      .order('order_index', { ascending: true });

    if (!error && data) {
      setModules(data);
    }
  };

  const fetchContents = async (moduleId: string) => {
    const { data, error } = await supabase
      .from('members_contents')
      .select('*')
      .eq('module_id', moduleId)
      .order('order_index', { ascending: true });

    if (!error && data) {
      setContents(data);
    }
  };

  const handleCreateArea = async () => {
    if (!user || !areaForm.name) {
      toast({
        title: "Erro",
        description: "Preencha o nome da área de membros",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('members_areas')
      .insert({
        user_id: user.id,
        name: areaForm.name,
        description: areaForm.description,
        logo_url: areaForm.logo_url || null,
        primary_color: areaForm.primary_color,
        requires_approval: areaForm.requires_approval,
        is_active: true,
      })
      .select()
      .single();

    setLoading(false);

    if (error) {
      toast({
        title: "Erro ao criar área",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Área criada com sucesso!",
        description: "Agora você pode adicionar módulos e conteúdos",
      });
      setAreas([...areas, data]);
      setAreaForm({
        name: "",
        description: "",
        logo_url: "",
        primary_color: "#6366f1",
        requires_approval: false,
      });
    }
  };

  const handleCreateModule = async () => {
    if (!selectedArea || !moduleForm.title) {
      toast({
        title: "Erro",
        description: "Selecione uma área e preencha o título do módulo",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('members_modules')
      .insert({
        area_id: selectedArea.id,
        title: moduleForm.title,
        description: moduleForm.description,
        order_index: modules.length,
        is_published: true,
      })
      .select()
      .single();

    setLoading(false);

    if (error) {
      toast({
        title: "Erro ao criar módulo",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Módulo criado!",
      });
      setModules([...modules, data]);
      setModuleForm({ title: "", description: "" });
    }
  };

  const handleCreateContent = async () => {
    if (!selectedModule || !contentForm.title) {
      toast({
        title: "Erro",
        description: "Selecione um módulo e preencha o título do conteúdo",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('members_contents')
      .insert({
        module_id: selectedModule.id,
        title: contentForm.title,
        content_type: contentForm.content_type,
        content_url: contentForm.content_url || null,
        content_text: contentForm.content_text || null,
        order_index: contents.length,
        is_free: contentForm.is_free,
      })
      .select()
      .single();

    setLoading(false);

    if (error) {
      toast({
        title: "Erro ao criar conteúdo",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Conteúdo adicionado!",
      });
      setContents([...contents, data]);
      setContentForm({
        title: "",
        content_type: "text",
        content_url: "",
        content_text: "",
        is_free: false,
      });
    }
  };

  const handleDeleteArea = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta área de membros?")) return;

    const { error } = await supabase
      .from('members_areas')
      .delete()
      .eq('id', id);

    if (!error) {
      setAreas(areas.filter(a => a.id !== id));
      if (selectedArea?.id === id) {
        setSelectedArea(null);
      }
      toast({ title: "Área excluída" });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Users className="w-6 h-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Gerador de Área de Membros</h2>
            <p className="text-sm text-muted-foreground">
              Crie e gerencie áreas de membros com múltiplos módulos e conteúdos
            </p>
          </div>
        </div>

        <Tabs defaultValue="areas" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="areas">Áreas</TabsTrigger>
            <TabsTrigger value="modules">Módulos</TabsTrigger>
            <TabsTrigger value="contents">Conteúdos</TabsTrigger>
          </TabsList>

          <TabsContent value="areas" className="space-y-4">
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Nova Área de Membros</h3>
              <div className="space-y-4">
                <div>
                  <Label>Nome da Área</Label>
                  <Input
                    value={areaForm.name}
                    onChange={(e) => setAreaForm({ ...areaForm, name: e.target.value })}
                    placeholder="Ex: Curso de Marketing Digital"
                  />
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Textarea
                    value={areaForm.description}
                    onChange={(e) => setAreaForm({ ...areaForm, description: e.target.value })}
                    placeholder="Descreva sua área de membros"
                  />
                </div>
                <div>
                  <Label>URL do Logo</Label>
                  <Input
                    value={areaForm.logo_url}
                    onChange={(e) => setAreaForm({ ...areaForm, logo_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <Label>Cor Principal</Label>
                  <Input
                    type="color"
                    value={areaForm.primary_color}
                    onChange={(e) => setAreaForm({ ...areaForm, primary_color: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={areaForm.requires_approval}
                    onCheckedChange={(checked) => setAreaForm({ ...areaForm, requires_approval: checked })}
                  />
                  <Label>Requer aprovação para novos membros</Label>
                </div>
                <Button onClick={handleCreateArea} disabled={loading}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Área
                </Button>
              </div>
            </Card>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Minhas Áreas</h3>
              {areas.map((area) => (
                <Card key={area.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold">{area.name}</h4>
                      <p className="text-sm text-muted-foreground">{area.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedArea(area)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteArea(area.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="modules" className="space-y-4">
            {!selectedArea ? (
              <p className="text-center text-muted-foreground py-8">
                Selecione uma área para gerenciar módulos
              </p>
            ) : (
              <>
                <Card className="p-4">
                  <h3 className="text-lg font-semibold mb-4">
                    Novo Módulo - {selectedArea.name}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <Label>Título do Módulo</Label>
                      <Input
                        value={moduleForm.title}
                        onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                        placeholder="Ex: Introdução ao Marketing"
                      />
                    </div>
                    <div>
                      <Label>Descrição</Label>
                      <Textarea
                        value={moduleForm.description}
                        onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                        placeholder="Descreva o módulo"
                      />
                    </div>
                    <Button onClick={handleCreateModule} disabled={loading}>
                      <Plus className="w-4 h-4 mr-2" />
                      Criar Módulo
                    </Button>
                  </div>
                </Card>

                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Módulos</h3>
                  {modules.map((module) => (
                    <Card key={module.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold">{module.title}</h4>
                          <p className="text-sm text-muted-foreground">{module.description}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedModule(module)}
                        >
                          Selecionar
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="contents" className="space-y-4">
            {!selectedModule ? (
              <p className="text-center text-muted-foreground py-8">
                Selecione um módulo para adicionar conteúdos
              </p>
            ) : (
              <>
                <Card className="p-4">
                  <h3 className="text-lg font-semibold mb-4">
                    Novo Conteúdo - {selectedModule.title}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <Label>Título do Conteúdo</Label>
                      <Input
                        value={contentForm.title}
                        onChange={(e) => setContentForm({ ...contentForm, title: e.target.value })}
                        placeholder="Ex: Aula 1 - Fundamentos"
                      />
                    </div>
                    <div>
                      <Label>Tipo de Conteúdo</Label>
                      <select
                        className="w-full p-2 border rounded"
                        value={contentForm.content_type}
                        onChange={(e) => setContentForm({ ...contentForm, content_type: e.target.value as Content['content_type'] })}
                      >
                        <option value="text">Texto</option>
                        <option value="video">Vídeo</option>
                        <option value="pdf">PDF</option>
                        <option value="image">Imagem</option>
                      </select>
                    </div>
                    {contentForm.content_type === 'text' ? (
                      <div>
                        <Label>Conteúdo</Label>
                        <Textarea
                          value={contentForm.content_text}
                          onChange={(e) => setContentForm({ ...contentForm, content_text: e.target.value })}
                          placeholder="Digite o conteúdo"
                          rows={6}
                        />
                      </div>
                    ) : (
                      <div>
                        <Label>URL do Conteúdo</Label>
                        <Input
                          value={contentForm.content_url}
                          onChange={(e) => setContentForm({ ...contentForm, content_url: e.target.value })}
                          placeholder="https://..."
                        />
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={contentForm.is_free}
                        onCheckedChange={(checked) => setContentForm({ ...contentForm, is_free: checked })}
                      />
                      <Label>Conteúdo gratuito (aula demonstrativa)</Label>
                    </div>
                    <Button onClick={handleCreateContent} disabled={loading}>
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Conteúdo
                    </Button>
                  </div>
                </Card>

                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Conteúdos</h3>
                  {contents.map((content) => (
                    <Card key={content.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {content.content_type === 'video' && <Video className="w-5 h-5 text-primary" />}
                          {content.content_type === 'text' && <FileText className="w-5 h-5 text-primary" />}
                          {content.content_type === 'image' && <ImageIcon className="w-5 h-5 text-primary" />}
                          {content.content_type === 'pdf' && <FileText className="w-5 h-5 text-primary" />}
                          <div>
                            <h4 className="font-semibold">{content.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {content.is_free ? "Gratuito" : "Exclusivo"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
