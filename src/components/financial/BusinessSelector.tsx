import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Building2, User, Plus, ArrowRight, Briefcase, Layers, MoreVertical, Pencil, Trash2, GripVertical, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Business {
  id: string;
  name: string;
  business_type: 'personal' | 'company';
  description?: string;
}

interface BusinessSelectorProps {
  businesses: Business[];
  onSelectBusiness: (businessId: string) => void;
  onSelectMultipleBusinesses?: (businessIds: string[]) => void;
  onCreateBusiness: (data: { name: string; business_type: 'personal' | 'company'; description: string }) => void;
  onUpdateBusiness?: (id: string, data: { name: string; business_type: 'personal' | 'company'; description: string }) => void;
  onDeleteBusiness?: (id: string) => void;
  onReorderBusinesses?: (orderedIds: string[]) => void;
}

interface SortableBusinessCardProps {
  business: Business;
  multiSelectMode: boolean;
  reorderMode: boolean;
  selected: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onSelect: () => void;
  onToggle: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  showActions: boolean;
}

const SortableBusinessCard = ({
  business,
  multiSelectMode,
  reorderMode,
  selected,
  canMoveUp,
  canMoveDown,
  onSelect,
  onToggle,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  showActions,
}: SortableBusinessCardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: business.id,
    disabled: !reorderMode,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "hover:border-primary hover:shadow-lg transition-all group relative",
        !reorderMode && "cursor-pointer",
        reorderMode && "cursor-grab active:cursor-grabbing",
        multiSelectMode && selected && "border-primary ring-2 ring-primary/30",
        isDragging && "ring-2 ring-primary"
      )}
      onClick={() => {
        if (reorderMode) return;
        if (multiSelectMode) onToggle();
        else onSelect();
      }}
    >
      {reorderMode && (
        <>
          <div
            {...attributes}
            {...listeners}
            className="absolute top-2 left-2 z-10 p-1.5 rounded-md bg-muted/80 hover:bg-muted touch-none"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="absolute top-2 right-2 z-10 flex gap-1" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={!canMoveUp}
              onClick={onMoveUp}
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={!canMoveDown}
              onClick={onMoveDown}
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}
      {!reorderMode && !multiSelectMode && showActions && (
        <div className="absolute top-2 right-2 z-10" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="h-4 w-4 mr-2" /> Editar
                </DropdownMenuItem>
              )}
              {onEdit && onDelete && <DropdownMenuSeparator />}
              {onDelete && (
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={onDelete}
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Excluir
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {multiSelectMode && !reorderMode && (
              <Checkbox
                checked={selected}
                onCheckedChange={onToggle}
                onClick={(e) => e.stopPropagation()}
              />
            )}
            <div className={cn(
              "p-3 rounded-lg",
              business.business_type === 'company' ? 'bg-blue-500/10' : 'bg-green-500/10'
            )}>
              {business.business_type === 'company' ? (
                <Building2 className={cn("w-6 h-6", "text-blue-600")} />
              ) : (
                <User className={cn("w-6 h-6", "text-green-600")} />
              )}
            </div>
          </div>
        </div>
        <h3 className="font-semibold text-lg mb-1">{business.name}</h3>
        <Badge variant="secondary" className="text-xs">
          {business.business_type === 'company' ? 'Pessoa Jurídica' : 'Pessoa Física'}
        </Badge>
        {business.description && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
            {business.description}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export const BusinessSelector = ({ businesses, onSelectBusiness, onSelectMultipleBusinesses, onCreateBusiness, onUpdateBusiness, onDeleteBusiness, onReorderBusinesses }: BusinessSelectorProps) => {
  const [reorderMode, setReorderMode] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [deletingBusiness, setDeletingBusiness] = useState<Business | null>(null);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    name: '',
    business_type: 'personal' as 'personal' | 'company',
    description: ''
  });
  const [editFormData, setEditFormData] = useState({
    name: '',
    business_type: 'personal' as 'personal' | 'company',
    description: ''
  });

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleViewConsolidated = () => {
    if (selectedIds.size < 2) return;
    onSelectMultipleBusinesses?.(Array.from(selectedIds));
  };

  const handleCreate = () => {
    onCreateBusiness(formData);
    setIsCreateDialogOpen(false);
    setFormData({ name: '', business_type: 'personal', description: '' });
  };

  const openEdit = (b: Business) => {
    setEditingBusiness(b);
    setEditFormData({
      name: b.name,
      business_type: b.business_type,
      description: b.description || '',
    });
  };

  const handleUpdate = () => {
    if (!editingBusiness) return;
    onUpdateBusiness?.(editingBusiness.id, editFormData);
    setEditingBusiness(null);
  };

  const handleConfirmDelete = () => {
    if (!deletingBusiness) return;
    onDeleteBusiness?.(deletingBusiness.id);
    setDeletingBusiness(null);
  };

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center py-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Briefcase className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Gestão Financeira</h1>
        <p className="text-muted-foreground max-w-md">
          Selecione um negócio para gerenciar suas finanças ou crie um novo
        </p>
        {businesses.length >= 2 && (
          <div className="flex items-center gap-3 mt-4">
            <Button
              variant={multiSelectMode ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setMultiSelectMode(!multiSelectMode);
                setSelectedIds(new Set());
              }}
            >
              <Layers className="w-4 h-4 mr-2" />
              {multiSelectMode ? "Cancelar Seleção" : "Juntar Negócios"}
            </Button>
            {multiSelectMode && selectedIds.size >= 2 && (
              <Button size="sm" onClick={handleViewConsolidated}>
                Ver Consolidado ({selectedIds.size} selecionados)
              </Button>
            )}
          </div>
        )}
      </div>

      {businesses.length > 0 ? (
        <div className="w-full max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {businesses.map((business) => (
              <Card 
                key={business.id} 
                className={cn(
                  "cursor-pointer hover:border-primary hover:shadow-lg transition-all group relative",
                  multiSelectMode && selectedIds.has(business.id) && "border-primary ring-2 ring-primary/30"
                )}
                onClick={() => {
                  if (multiSelectMode) {
                    toggleSelection(business.id);
                  } else {
                    onSelectBusiness(business.id);
                  }
                }}
              >
                {!multiSelectMode && (onUpdateBusiness || onDeleteBusiness) && (
                  <div className="absolute top-2 right-2 z-10" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {onUpdateBusiness && (
                          <DropdownMenuItem onClick={() => openEdit(business)}>
                            <Pencil className="h-4 w-4 mr-2" /> Editar
                          </DropdownMenuItem>
                        )}
                        {onUpdateBusiness && onDeleteBusiness && <DropdownMenuSeparator />}
                        {onDeleteBusiness && (
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeletingBusiness(business)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Excluir
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {multiSelectMode && (
                        <Checkbox
                          checked={selectedIds.has(business.id)}
                          onCheckedChange={() => toggleSelection(business.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      )}
                      <div className={cn(
                        "p-3 rounded-lg",
                        business.business_type === 'company' ? 'bg-blue-500/10' : 'bg-green-500/10'
                      )}>
                        {business.business_type === 'company' ? (
                          <Building2 className={cn("w-6 h-6", "text-blue-600")} />
                        ) : (
                          <User className={cn("w-6 h-6", "text-green-600")} />
                        )}
                      </div>
                    </div>
                  </div>
                  <h3 className="font-semibold text-lg mb-1">{business.name}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {business.business_type === 'company' ? 'Pessoa Jurídica' : 'Pessoa Física'}
                  </Badge>
                  {business.description && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {business.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}

            {/* Create New Card */}
            <Card 
              className="cursor-pointer border-dashed hover:border-primary hover:bg-primary/5 transition-all"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[160px]">
                <div className="p-3 rounded-full bg-muted mb-3">
                  <Plus className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="font-medium text-muted-foreground">Adicionar Outra Gestão</p>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Nenhum negócio cadastrado</CardTitle>
            <CardDescription>
              Crie seu primeiro negócio para começar a gerenciar suas finanças
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button size="lg" onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Negócio
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Negócio</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Nome do Negócio</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Minha Loja, Consultoria XYZ"
              />
            </div>
            <div>
              <Label>Tipo</Label>
              <Select 
                value={formData.business_type} 
                onValueChange={(v: 'personal' | 'company') => setFormData({ ...formData, business_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Pessoa Física (CPF)
                    </div>
                  </SelectItem>
                  <SelectItem value="company">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Pessoa Jurídica (CNPJ)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Descrição (opcional)</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Breve descrição do negócio"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={!formData.name.trim()}>
              Criar Negócio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingBusiness} onOpenChange={(open) => !open && setEditingBusiness(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Gestão</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Nome do Negócio</Label>
              <Input
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Tipo</Label>
              <Select 
                value={editFormData.business_type} 
                onValueChange={(v: 'personal' | 'company') => setEditFormData({ ...editFormData, business_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Pessoa Física (CPF)
                    </div>
                  </SelectItem>
                  <SelectItem value="company">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Pessoa Jurídica (CNPJ)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Descrição (opcional)</Label>
              <Input
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingBusiness(null)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdate} disabled={!editFormData.name.trim()}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingBusiness} onOpenChange={(open) => !open && setDeletingBusiness(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir gestão "{deletingBusiness?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Todos os dados vinculados a esta gestão podem ser perdidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleConfirmDelete}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
