import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Edit, Lock, Unlock, Image, Video, FileText, Link as LinkIcon, MousePointer, GripVertical } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ImageUpload } from "@/components/ImageUpload";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ContentBlock {
  id: string;
  type: 'image' | 'video' | 'document' | 'link' | 'button' | 'text';
  content: string;
  title?: string;
  order_index: number;
}

interface Section {
  id: string;
  title: string;
  description?: string;
  order_index: number;
  blocks: ContentBlock[];
}

interface MembersArea {
  id: string;
  name: string;
  description: string;
  password: string;
  slug: string;
  sections: Section[];
  is_active: boolean;
}

const SortableBlock = ({ block, onEdit, onDelete }: { block: ContentBlock; onEdit: () => void; onDelete: () => void }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getIcon = () => {
    switch (block.type) {
      case 'image': return <Image className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      case 'document': return <FileText className="w-4 h-4" />;
      case 'link': return <LinkIcon className="w-4 h-4" />;
      case 'button': return <MousePointer className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 p-3 bg-muted rounded-lg">
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>
      {getIcon()}
      <div className="flex-1">
        <div className="font-medium text-sm">{block.title || block.type}</div>
        <div className="text-xs text-muted-foreground truncate">{block.content}</div>
      </div>
      <Button variant="ghost" size="icon" onClick={onEdit}>
        <Edit className="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={onDelete}>
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
};

export function SimpleMembersArea() {
  const [areas, setAreas] = useState<MembersArea[]>([]);
  const [selectedArea, setSelectedArea] = useState<MembersArea | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAddSectionDialogOpen, setIsAddSectionDialogOpen] = useState(false);
  const [isAddBlockDialogOpen, setIsAddBlockDialogOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');

  const [areaFormData, setAreaFormData] = useState({
    name: '',
    description: '',
    password: '',
  });

  const [sectionFormData, setSectionFormData] = useState({
    title: '',
    description: '',
  });

  const [blockFormData, setBlockFormData] = useState({
    type: 'text' as ContentBlock['type'],
    title: '',
    content: '',
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  useEffect(() => {
    loadAreas();
  }, []);

  const loadAreas = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('simple_members_areas' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAreas((data || []) as any as MembersArea[]);
    } catch (error: any) {
      toast.error('Erro ao carregar áreas: ' + error.message);
    }
  };

  const handleCreateArea = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const slug = areaFormData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

      const { data, error } = await supabase
        .from('simple_members_areas' as any)
        .insert({
          user_id: user.id,
          name: areaFormData.name,
          description: areaFormData.description,
          password: areaFormData.password,
          slug,
          sections: [],
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Área de membros criada com sucesso!');
      setIsCreateDialogOpen(false);
      setAreaFormData({ name: '', description: '', password: '' });
      loadAreas();
    } catch (error: any) {
      toast.error('Erro ao criar área: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSection = async () => {
    if (!selectedArea) return;

    try {
      const newSection: Section = {
        id: crypto.randomUUID(),
        title: sectionFormData.title,
        description: sectionFormData.description,
        order_index: selectedArea.sections.length,
        blocks: [],
      };

      const updatedSections = [...selectedArea.sections, newSection];

      const { error } = await supabase
        .from('simple_members_areas' as any)
        .update({ sections: updatedSections as any })
        .eq('id', selectedArea.id);

      if (error) throw error;

      setSelectedArea({ ...selectedArea, sections: updatedSections });
      setIsAddSectionDialogOpen(false);
      setSectionFormData({ title: '', description: '' });
      toast.success('Seção adicionada!');
    } catch (error: any) {
      toast.error('Erro ao adicionar seção: ' + error.message);
    }
  };

  const handleAddBlock = async () => {
    if (!selectedArea || !selectedSection) return;

    try {
      const newBlock: ContentBlock = {
        id: crypto.randomUUID(),
        type: blockFormData.type,
        title: blockFormData.title,
        content: blockFormData.content,
        order_index: selectedSection.blocks.length,
      };

      const updatedSections = selectedArea.sections.map(section => {
        if (section.id === selectedSection.id) {
          return { ...section, blocks: [...section.blocks, newBlock] };
        }
        return section;
      });

      const { error } = await supabase
        .from('simple_members_areas' as any)
        .update({ sections: updatedSections as any })
        .eq('id', selectedArea.id);

      if (error) throw error;

      setSelectedArea({ ...selectedArea, sections: updatedSections });
      setIsAddBlockDialogOpen(false);
      setBlockFormData({ type: 'text', title: '', content: '' });
      setUploadedImageUrl('');
      toast.success('Bloco adicionado!');
    } catch (error: any) {
      toast.error('Erro ao adicionar bloco: ' + error.message);
    }
  };

  const handleCopyLink = (area: MembersArea) => {
    const link = `${window.location.origin}/members/${area.slug}`;
    navigator.clipboard.writeText(link);
    toast.success('Link copiado!');
  };

  const handleDragEnd = async (event: any, sectionId: string) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !selectedArea) return;

    const section = selectedArea.sections.find(s => s.id === sectionId);
    if (!section) return;

    const oldIndex = section.blocks.findIndex(b => b.id === active.id);
    const newIndex = section.blocks.findIndex(b => b.id === over.id);

    const reorderedBlocks = arrayMove(section.blocks, oldIndex, newIndex).map((block, idx) => ({
      ...block,
      order_index: idx,
    }));

    const updatedSections = selectedArea.sections.map(s => 
      s.id === sectionId ? { ...s, blocks: reorderedBlocks } : s
    );

    try {
      const { error } = await supabase
        .from('simple_members_areas' as any)
        .update({ sections: updatedSections as any })
        .eq('id', selectedArea.id);

      if (error) throw error;
      setSelectedArea({ ...selectedArea, sections: updatedSections });
    } catch (error: any) {
      toast.error('Erro ao reordenar: ' + error.message);
    }
  };

  if (selectedArea) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Button variant="ghost" onClick={() => setSelectedArea(null)} className="mb-2">
              ← Voltar
            </Button>
            <h2 className="text-2xl font-bold">{selectedArea.name}</h2>
            <p className="text-muted-foreground">{selectedArea.description}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => handleCopyLink(selectedArea)}>
              <LinkIcon className="w-4 h-4 mr-2" />
              Copiar Link
            </Button>
            <Button onClick={() => setIsAddSectionDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Seção
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Senha de Acesso: {selectedArea.password}
            </CardTitle>
          </CardHeader>
        </Card>

        <div className="space-y-6">
          {selectedArea.sections.map((section) => (
            <Card key={section.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{section.title}</CardTitle>
                    {section.description && <p className="text-sm text-muted-foreground">{section.description}</p>}
                  </div>
                  <Button onClick={() => { setSelectedSection(section); setIsAddBlockDialogOpen(true); }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Conteúdo
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, section.id)}>
                  <SortableContext items={section.blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                      {section.blocks.map((block) => (
                        <SortableBlock
                          key={block.id}
                          block={block}
                          onEdit={() => {}}
                          onDelete={() => {}}
                        />
                      ))}
                      {section.blocks.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          Nenhum conteúdo adicionado ainda
                        </div>
                      )}
                    </div>
                  </SortableContext>
                </DndContext>
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog open={isAddSectionDialogOpen} onOpenChange={setIsAddSectionDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Seção</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Título da Seção</Label>
                <Input
                  value={sectionFormData.title}
                  onChange={(e) => setSectionFormData({ ...sectionFormData, title: e.target.value })}
                  placeholder="Ex: Módulo 1 - Introdução"
                />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={sectionFormData.description}
                  onChange={(e) => setSectionFormData({ ...sectionFormData, description: e.target.value })}
                  placeholder="Descreva esta seção..."
                />
              </div>
              <Button onClick={handleAddSection} className="w-full">Adicionar Seção</Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isAddBlockDialogOpen} onOpenChange={setIsAddBlockDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Conteúdo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Tipo de Conteúdo</Label>
                <Select value={blockFormData.type} onValueChange={(value: any) => setBlockFormData({ ...blockFormData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Texto</SelectItem>
                    <SelectItem value="image">Imagem</SelectItem>
                    <SelectItem value="video">Vídeo (URL)</SelectItem>
                    <SelectItem value="document">Documento</SelectItem>
                    <SelectItem value="link">Link</SelectItem>
                    <SelectItem value="button">Botão</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Título</Label>
                <Input
                  value={blockFormData.title}
                  onChange={(e) => setBlockFormData({ ...blockFormData, title: e.target.value })}
                  placeholder="Título do conteúdo"
                />
              </div>
              <div>
                <Label>Conteúdo</Label>
                {blockFormData.type === 'image' ? (
                  <ImageUpload
                    currentImage={blockFormData.content}
                    onImageSelect={(url) => setBlockFormData({ ...blockFormData, content: url })}
                    bucketName="members-content"
                  />
                ) : (
                  <Textarea
                    value={blockFormData.content}
                    onChange={(e) => setBlockFormData({ ...blockFormData, content: e.target.value })}
                    placeholder={
                      blockFormData.type === 'video' ? 'URL do vídeo (YouTube, Vimeo, etc)' :
                      blockFormData.type === 'link' || blockFormData.type === 'button' ? 'URL do link' :
                      'Conteúdo...'
                    }
                  />
                )}
              </div>
              <Button onClick={handleAddBlock} className="w-full">Adicionar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Áreas de Membros</h2>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Área
        </Button>
      </div>

      {areas.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">Nenhuma área de membros criada ainda</p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeira Área
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {areas.map((area) => (
            <Card key={area.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSelectedArea(area)}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{area.name}</span>
                  {area.is_active ? <Unlock className="w-4 h-4 text-green-500" /> : <Lock className="w-4 h-4" />}
                </CardTitle>
                <p className="text-sm text-muted-foreground">{area.description}</p>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center text-sm">
                  <Badge variant="outline">{area.sections.length} seções</Badge>
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleCopyLink(area); }}>
                    <LinkIcon className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Área de Membros</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome da Área</Label>
              <Input
                value={areaFormData.name}
                onChange={(e) => setAreaFormData({ ...areaFormData, name: e.target.value })}
                placeholder="Ex: Curso de Marketing Digital"
              />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea
                value={areaFormData.description}
                onChange={(e) => setAreaFormData({ ...areaFormData, description: e.target.value })}
                placeholder="Descreva a área de membros..."
              />
            </div>
            <div>
              <Label>Senha de Acesso</Label>
              <Input
                value={areaFormData.password}
                onChange={(e) => setAreaFormData({ ...areaFormData, password: e.target.value })}
                placeholder="Defina uma senha"
                type="text"
              />
              <p className="text-xs text-muted-foreground mt-1">Os membros precisarão desta senha para acessar o conteúdo</p>
            </div>
            <Button onClick={handleCreateArea} className="w-full" disabled={loading}>
              {loading ? 'Criando...' : 'Criar Área'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}