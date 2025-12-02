import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { ImageUpload } from "@/components/ImageUpload";
import { 
  FileText, 
  Plus,
  Edit,
  Trash2,
  Copy,
  Eye,
  GripVertical,
  CheckSquare,
  Phone,
  Mail,
  Type,
  Hash,
  Upload,
  Calendar,
  Clock,
  Link2,
  List,
  Circle,
  Star,
  Lock,
  LockOpen
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { HexColorPicker } from 'react-colorful';

interface BriefingField {
  id: string;
  type: 'text' | 'textarea' | 'email' | 'phone' | 'number' | 'checkbox' | 'file' | 'date' | 'time' | 'url' | 'select' | 'radio' | 'rating';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
}

interface Briefing {
  id: string;
  title: string;
  description?: string;
  fields: BriefingField[];
  is_active: boolean;
  is_blocked: boolean;
  responses_count: number;
  created_at: string;
}

function SortableField({ field, onEdit, onDelete }: { field: BriefingField; onEdit: () => void; onDelete: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getFieldIcon = (type: string) => {
    switch (type) {
      case 'text': return <Type className="h-4 w-4" />;
      case 'textarea': return <FileText className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      case 'phone': return <Phone className="h-4 w-4" />;
      case 'number': return <Hash className="h-4 w-4" />;
      case 'checkbox': return <CheckSquare className="h-4 w-4" />;
      case 'file': return <Upload className="h-4 w-4" />;
      case 'date': return <Calendar className="h-4 w-4" />;
      case 'time': return <Clock className="h-4 w-4" />;
      case 'url': return <Link2 className="h-4 w-4" />;
      case 'select': return <List className="h-4 w-4" />;
      case 'radio': return <Circle className="h-4 w-4" />;
      case 'rating': return <Star className="h-4 w-4" />;
      default: return <Type className="h-4 w-4" />;
    }
  };

  return (
    <div ref={setNodeRef} style={style} className="bg-card border rounded-lg p-4">
      <div className="flex items-center gap-3">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {getFieldIcon(field.type)}
            <span className="font-medium">{field.label}</span>
            {field.required && <Badge variant="destructive" className="text-xs">Obrigatório</Badge>}
          </div>
          <p className="text-sm text-muted-foreground mt-1">Tipo: {field.type}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={onEdit}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function BriefingCreatorPanel() {
  const [briefings, setBriefings] = useState<Briefing[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isFieldDialogOpen, setIsFieldDialogOpen] = useState(false);
  const [editingBriefing, setEditingBriefing] = useState<Briefing | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    logo_url: '',
    primary_color: '#8B5CF6',
    secondary_color: '#EC4899',
    fields: [] as BriefingField[]
  });

  const [fieldData, setFieldData] = useState<BriefingField>({
    id: '',
    type: 'text',
    label: '',
    placeholder: '',
    required: false
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadBriefings();
  }, []);

  const loadBriefings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('briefings' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBriefings((data || []) as unknown as Briefing[]);
    } catch (error: any) {
      toast.error("Erro ao carregar briefings");
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setFormData(prev => {
        const oldIndex = prev.fields.findIndex(f => f.id === active.id);
        const newIndex = prev.fields.findIndex(f => f.id === over.id);
        return {
          ...prev,
          fields: arrayMove(prev.fields, oldIndex, newIndex)
        };
      });
    }
  };

  const handleAddField = () => {
    if (!fieldData.label.trim()) {
      toast.error("Preencha o nome do campo");
      return;
    }

    setFormData(prev => {
      // Editar existente
      if (fieldData.id) {
        const idx = prev.fields.findIndex(f => f.id === fieldData.id);
        if (idx !== -1) {
          const updated = [...prev.fields];
          // Filtrar opções vazias ao salvar
          const cleanedField = {
            ...fieldData,
            options: fieldData.options?.filter(opt => opt.trim()).length ? fieldData.options.filter(opt => opt.trim()) : undefined
          };
          updated[idx] = cleanedField;
          toast.success("Campo atualizado!");
          return { ...prev, fields: updated };
        }
      }

      // Evitar duplicatas por label+type
      const exists = prev.fields.some(f => f.label.trim().toLowerCase() === fieldData.label.trim().toLowerCase() && f.type === fieldData.type);
      if (exists) {
        toast.error("Já existe um campo com esse nome e tipo");
        return prev;
      }

      // Filtrar opções vazias ao salvar
      const cleanedField = {
        ...fieldData,
        id: `field-${Date.now()}-${Math.random()}`,
        options: fieldData.options?.filter(opt => opt.trim()).length ? fieldData.options.filter(opt => opt.trim()) : undefined
      };
      toast.success("Campo adicionado!");
      return { ...prev, fields: [...prev.fields, cleanedField] };
    });

    setFieldData({ id: '', type: 'text', label: '', placeholder: '', required: false });
    setIsFieldDialogOpen(false);
  };

  const handleRemoveField = (fieldId: string) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.filter(f => f.id !== fieldId)
    }));
  };

  const handleSaveBriefing = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (!formData.title || formData.fields.length === 0) {
        toast.error("Preencha o título e adicione pelo menos um campo");
        return;
      }

      if (editingBriefing) {
        const { error } = await supabase
          .from('briefings' as any)
          .update({
            title: formData.title,
            description: formData.description,
            logo_url: formData.logo_url,
            primary_color: formData.primary_color,
            secondary_color: formData.secondary_color,
            fields: formData.fields
          })
          .eq('id', editingBriefing.id);

        if (error) throw error;
        toast.success("Briefing atualizado!");
      } else {
        const { error } = await supabase
          .from('briefings' as any)
          .insert([{
            user_id: user.id,
            title: formData.title,
            description: formData.description,
            logo_url: formData.logo_url,
            primary_color: formData.primary_color,
            secondary_color: formData.secondary_color,
            fields: formData.fields,
            is_active: true,
            responses_count: 0
          }]);

        if (error) throw error;
        toast.success("Briefing criado com sucesso!");
      }

      setIsCreateDialogOpen(false);
      setEditingBriefing(null);
      setFormData({ title: '', description: '', logo_url: '', primary_color: '#8B5CF6', secondary_color: '#EC4899', fields: [] });
      setShowPrimaryColorPicker(false);
      setShowSecondaryColorPicker(false);
      loadBriefings();
    } catch (error: any) {
      toast.error("Erro ao salvar briefing");
    }
  };

  const handleEditBriefing = (briefing: Briefing) => {
    setEditingBriefing(briefing);
    setFormData({
      title: briefing.title,
      description: briefing.description || '',
      logo_url: (briefing as any).logo_url || '',
      primary_color: (briefing as any).primary_color || '#8B5CF6',
      secondary_color: (briefing as any).secondary_color || '#EC4899',
      fields: briefing.fields
    });
    setShowPrimaryColorPicker(false);
    setShowSecondaryColorPicker(false);
    setIsCreateDialogOpen(true);
  };

  const [deleteBriefingId, setDeleteBriefingId] = useState<string | null>(null);
  const [showPrimaryColorPicker, setShowPrimaryColorPicker] = useState(false);
  const [showSecondaryColorPicker, setShowSecondaryColorPicker] = useState(false);

  const handleDeleteBriefing = async () => {
    if (!deleteBriefingId) return;

    try {
      const { error } = await supabase
        .from('briefings' as any)
        .delete()
        .eq('id', deleteBriefingId);

      if (error) throw error;
      toast.success("Briefing excluído!");
      loadBriefings();
    } catch (error: any) {
      toast.error("Erro ao excluir briefing");
    } finally {
      setDeleteBriefingId(null);
    }
  };

  const handleCopyLink = (briefingId: string) => {
    const link = `${window.location.origin}/briefing/${briefingId}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copiado!");
  };

  const handleToggleBlock = async (briefing: Briefing) => {
    try {
      const newBlockedState = !briefing.is_blocked;
      const { error } = await supabase
        .from('briefings' as any)
        .update({ is_blocked: newBlockedState })
        .eq('id', briefing.id);

      if (error) throw error;
      
      toast.success(newBlockedState ? "Briefing bloqueado!" : "Briefing desbloqueado!");
      loadBriefings();
    } catch (error: any) {
      toast.error("Erro ao atualizar briefing");
    }
  };

  const totalResponses = briefings.reduce((sum, b) => sum + b.responses_count, 0);
  const totalFields = briefings.reduce((sum, b) => sum + b.fields.length, 0);

  const fieldTypeOptions = [
    { value: 'text', label: 'Texto Curto', icon: Type },
    { value: 'textarea', label: 'Texto Longo', icon: FileText },
    { value: 'email', label: 'E-mail', icon: Mail },
    { value: 'phone', label: 'Telefone', icon: Phone },
    { value: 'number', label: 'Número', icon: Hash },
    { value: 'checkbox', label: 'Checkbox', icon: CheckSquare },
    { value: 'select', label: 'Lista Suspensa', icon: List },
    { value: 'radio', label: 'Múltipla Escolha', icon: Circle },
    { value: 'rating', label: 'Avaliação (Estrelas)', icon: Star },
    { value: 'file', label: 'Upload de Arquivo', icon: Upload },
    { value: 'date', label: 'Data', icon: Calendar },
    { value: 'time', label: 'Hora', icon: Clock },
    { value: 'url', label: 'Link/URL', icon: Link2 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Criador de Briefing</h2>
          <p className="text-muted-foreground">Crie formulários personalizados para capturar informações</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary shadow-glow" onClick={() => {
              setEditingBriefing(null);
              setFormData({ title: '', description: '', logo_url: '', primary_color: '#8B5CF6', secondary_color: '#EC4899', fields: [] });
              setShowPrimaryColorPicker(false);
              setShowSecondaryColorPicker(false);
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Briefing
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>{editingBriefing ? 'Editar' : 'Criar'} Briefing</DialogTitle>
              <DialogDescription>Configure seu formulário personalizado</DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="info">Informações</TabsTrigger>
                <TabsTrigger value="fields">Campos ({formData.fields.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="info" className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label>Título do Briefing</Label>
                    <Input 
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      placeholder="Ex: Briefing de Projeto"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Descrição</Label>
                    <Textarea 
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Descrição do briefing..."
                      rows={3}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Logo (opcional)</Label>
                    <ImageUpload
                      onImageSelect={(url) => setFormData({...formData, logo_url: url})}
                      currentImage={formData.logo_url}
                      bucketName="briefing-logos"
                      label="Logo da empresa"
                    />
                  </div>
                    <div className="space-y-3">
                    <Label>Cores Personalizadas</Label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="grid gap-2">
                        <Label className="text-sm">Cor Primária</Label>
                        <Popover modal={false} open={showPrimaryColorPicker} onOpenChange={setShowPrimaryColorPicker}>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start gap-2">
                              <div 
                                className="w-5 h-5 rounded border border-border" 
                                style={{ backgroundColor: formData.primary_color }}
                              />
                              <span className="text-sm">{formData.primary_color}</span>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-3" onInteractOutside={(e) => e.preventDefault()}>
                            <div className="space-y-3" style={{ pointerEvents: 'auto' }}>
                              <div style={{ touchAction: 'none' }}>
                                <HexColorPicker
                                  color={formData.primary_color}
                                  onChange={(color) => setFormData({...formData, primary_color: color})}
                                />
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="grid gap-2">
                        <Label className="text-sm">Cor Secundária</Label>
                        <Popover modal={false} open={showSecondaryColorPicker} onOpenChange={setShowSecondaryColorPicker}>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start gap-2">
                              <div 
                                className="w-5 h-5 rounded border border-border" 
                                style={{ backgroundColor: formData.secondary_color }}
                              />
                              <span className="text-sm">{formData.secondary_color}</span>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-3" onInteractOutside={(e) => e.preventDefault()}>
                            <div className="space-y-3" style={{ pointerEvents: 'auto' }}>
                              <div style={{ touchAction: 'none' }}>
                                <HexColorPicker
                                  color={formData.secondary_color}
                                  onChange={(color) => setFormData({...formData, secondary_color: color})}
                                />
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="fields" className="space-y-4 max-h-[60vh] overflow-y-auto">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    Arraste para reordenar os campos
                  </p>
                  <Dialog open={isFieldDialogOpen} onOpenChange={setIsFieldDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Adicionar Campo
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Adicionar Campo</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label>Tipo de Campo</Label>
                          <Select
                            value={fieldData.type}
                            onValueChange={(value: any) => setFieldData({...fieldData, type: value})}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {fieldTypeOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  <div className="flex items-center gap-2">
                                    <option.icon className="h-4 w-4" />
                                    {option.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label>Rótulo do Campo</Label>
                          <Input 
                            value={fieldData.label}
                            onChange={(e) => setFieldData({...fieldData, label: e.target.value})}
                            placeholder="Ex: Nome Completo"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Placeholder (opcional)</Label>
                          <Input 
                            value={fieldData.placeholder}
                            onChange={(e) => setFieldData({...fieldData, placeholder: e.target.value})}
                            placeholder="Ex: Digite seu nome"
                          />
                        </div>
                        
                        {/* Campo de opções para select, radio */}
                        {(['select', 'radio'].includes(fieldData.type)) && (
                          <div className="grid gap-2">
                            <Label>Opções (uma por linha)</Label>
                            <Textarea
                              value={fieldData.options?.join('\n') || ''}
                              onChange={(e) => setFieldData({
                                ...fieldData, 
                                options: e.target.value.split('\n')
                              })}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.stopPropagation();
                                }
                              }}
                              placeholder="Opção 1&#10;Opção 2&#10;Opção 3"
                              rows={4}
                            />
                            <p className="text-xs text-muted-foreground">Digite uma opção por linha</p>
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="required"
                            checked={fieldData.required}
                            onChange={(e) => setFieldData({...fieldData, required: e.target.checked})}
                            className="rounded border-gray-300"
                          />
                          <Label htmlFor="required" className="cursor-pointer">Campo obrigatório</Label>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsFieldDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button onClick={handleAddField} disabled={!fieldData.label}>
                          Adicionar
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                {formData.fields.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Nenhum campo adicionado ainda</p>
                  </div>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={formData.fields.map(f => f.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-3">
                        {formData.fields.map((field) => (
                          <SortableField
                            key={field.id}
                            field={field}
                            onEdit={() => {
                              setFieldData(field);
                              setIsFieldDialogOpen(true);
                            }}
                            onDelete={() => handleRemoveField(field.id)}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </TabsContent>
            </Tabs>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsCreateDialogOpen(false);
                setEditingBriefing(null);
                setFormData({ title: '', description: '', logo_url: '', primary_color: '#8B5CF6', secondary_color: '#EC4899', fields: [] });
              }}>
                Cancelar
              </Button>
              <Button onClick={handleSaveBriefing} className="gradient-primary">
                {editingBriefing ? 'Atualizar' : 'Criar'} Briefing
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="glass hover:shadow-glow transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Briefings</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{briefings.length}</div>
            <p className="text-xs text-muted-foreground">
              {briefings.filter(b => b.is_active).length} ativos
            </p>
          </CardContent>
        </Card>

        <Card className="glass hover:shadow-glow transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Campos</CardTitle>
            <Plus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFields}</div>
            <p className="text-xs text-muted-foreground">total de campos</p>
          </CardContent>
        </Card>

        <Card className="glass hover:shadow-glow transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Respostas</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalResponses}</div>
            <p className="text-xs text-muted-foreground">enviadas</p>
          </CardContent>
        </Card>

        <Card className="glass hover:shadow-glow transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {briefings.length > 0 ? Math.round(totalResponses / briefings.length) : 0}
            </div>
            <p className="text-xs text-muted-foreground">respostas/briefing</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Briefings */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>Meus Briefings</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : briefings.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                Nenhum briefing criado ainda
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)} className="gradient-primary">
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeiro Briefing
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {briefings.map((briefing) => (
                <Card key={briefing.id} className="hover:shadow-lg transition-smooth">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base mb-1">{briefing.title}</CardTitle>
                        <div className="flex gap-2 mt-2">
                          <Badge variant={briefing.is_active ? 'default' : 'secondary'}>
                            {briefing.is_active ? 'Ativo' : 'Inativo'}
                          </Badge>
                          {briefing.is_blocked && (
                            <Badge variant="destructive" className="flex items-center gap-1">
                              <Lock className="h-3 w-3" />
                              Bloqueado
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {briefing.description || 'Sem descrição'}
                    </p>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Campos</p>
                        <p className="font-semibold">{briefing.fields.length}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Respostas</p>
                        <p className="font-semibold text-success">{briefing.responses_count}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleCopyLink(briefing.id)}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Link
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleToggleBlock(briefing)}
                        title={briefing.is_blocked ? "Desbloquear" : "Bloquear"}
                      >
                        {briefing.is_blocked ? (
                          <LockOpen className="h-3 w-3" />
                        ) : (
                          <Lock className="h-3 w-3" />
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditBriefing(briefing)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setDeleteBriefingId(briefing.id)}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <DeleteConfirmDialog
        open={!!deleteBriefingId}
        onOpenChange={() => setDeleteBriefingId(null)}
        onConfirm={handleDeleteBriefing}
        description="Você tem certeza que deseja excluir este briefing? Esta ação não pode ser desfeita."
      />
    </div>
  );
}
