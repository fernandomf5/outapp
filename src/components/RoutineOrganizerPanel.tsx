import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { 
  Calendar,
  Plus,
  Target,
  Clock,
  Trash2,
  Edit,
  CheckCircle2,
  Circle,
  BarChart3,
  Bell,
  RefreshCw,
  Palette,
  TrendingUp,
  Award,
  Zap,
  GripVertical,
  Save,
  FolderOpen,
  Copy,
  FileText,
  Share2,
  Download,
  MessageCircle,
  Link2,
  ListPlus,
  ChevronDown
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format, startOfWeek, addDays, isToday, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";

interface RoutineItem {
  id: string;
  title: string;
  description: string | null;
  day_of_week: number;
  start_time: string | null;
  end_time: string | null;
  color: string;
  is_recurring: boolean;
  reminder_minutes: number | null;
  is_completed: boolean;
  completed_at: string | null;
  order_index: number;
}

interface RoutineTemplate {
  id: string;
  name: string;
  items: any[];
  created_at: string;
}

interface Routine {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

interface RoutineObjective {
  id: string;
  title: string;
  description: string | null;
  objective_type: 'weekly' | 'daily';
  day_of_week: number | null;
  target_value: number;
  current_value: number;
  color: string;
  week_start: string | null;
  is_completed: boolean;
}

interface RoutineCompletion {
  id: string;
  routine_item_id: string | null;
  objective_id: string | null;
  completion_date: string;
  completed_at: string;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo', short: 'Dom' },
  { value: 1, label: 'Segunda', short: 'Seg' },
  { value: 2, label: 'Terça', short: 'Ter' },
  { value: 3, label: 'Quarta', short: 'Qua' },
  { value: 4, label: 'Quinta', short: 'Qui' },
  { value: 5, label: 'Sexta', short: 'Sex' },
  { value: 6, label: 'Sábado', short: 'Sáb' }
];

const COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
];

const REMINDER_OPTIONS = [
  { value: null, label: 'Sem lembrete' },
  { value: 5, label: '5 minutos antes' },
  { value: 15, label: '15 minutos antes' },
  { value: 30, label: '30 minutos antes' },
  { value: 60, label: '1 hora antes' }
];

function SortableRoutineItem({ item, onToggleComplete, onEdit, onDelete }: {
  item: RoutineItem;
  onToggleComplete: (item: RoutineItem) => void;
  onEdit: (item: RoutineItem) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  const DESC_LIMIT = 80;
  const hasLongDesc = item.description && item.description.length > DESC_LIMIT;

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, backgroundColor: `${item.color}20`, borderLeft: `3px solid ${item.color}` }}
      className={`p-2 rounded-md transition-all ${item.is_completed ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start gap-2">
        <div {...attributes} {...listeners} className="cursor-grab hover:bg-muted rounded p-0.5 mt-0.5">
          <GripVertical className="h-3 w-3 text-muted-foreground" />
        </div>
        <Checkbox
          checked={item.is_completed}
          onCheckedChange={() => onToggleComplete(item)}
          className="mt-0.5"
        />
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-medium break-words ${item.is_completed ? 'line-through' : ''}`}>
            {item.title}
          </p>
          {item.description && (
            <div className="mt-0.5">
              <p className="text-[10px] text-muted-foreground break-words whitespace-pre-wrap">
                {hasLongDesc && !expanded ? item.description.slice(0, DESC_LIMIT) + '...' : item.description}
              </p>
              {hasLongDesc && (
                <button
                  onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                  className="text-[10px] text-primary hover:underline mt-0.5"
                >
                  {expanded ? 'Ver menos' : 'Ver mais'}
                </button>
              )}
            </div>
          )}
          {item.start_time && (
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock className="h-2 w-2" />
              {item.start_time}{item.end_time && ` - ${item.end_time}`}
            </p>
          )}
          <div className="flex gap-1 mt-1">
            {item.is_recurring && <RefreshCw className="h-2 w-2 text-muted-foreground" />}
            {item.reminder_minutes && <Bell className="h-2 w-2 text-muted-foreground" />}
          </div>
        </div>
        <div className="flex gap-0.5">
          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => onEdit(item)}>
            <Edit className="h-2 w-2" />
          </Button>
          <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive" onClick={() => onDelete(item.id)}>
            <Trash2 className="h-2 w-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function RoutineOrganizerPanel() {
  const { user } = useAuth();
  const [routineItems, setRoutineItems] = useState<RoutineItem[]>([]);
  const [objectives, setObjectives] = useState<RoutineObjective[]>([]);
  const [completions, setCompletions] = useState<RoutineCompletion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('weekly');
  
  // Routines management
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [activeRoutine, setActiveRoutine] = useState<Routine | null>(null);
  const [isNewRoutineOpen, setIsNewRoutineOpen] = useState(false);
  const [newRoutineName, setNewRoutineName] = useState('');
  const [isRenameRoutineOpen, setIsRenameRoutineOpen] = useState(false);
  const [renameRoutineName, setRenameRoutineName] = useState('');
  const [isDeleteRoutineOpen, setIsDeleteRoutineOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [routineToDelete, setRoutineToDelete] = useState<string | null>(null);
  
  // Dialogs
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);
  const [isAddObjectiveDialogOpen, setIsAddObjectiveDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RoutineItem | null>(null);
  const [editingObjective, setEditingObjective] = useState<RoutineObjective | null>(null);
  
  // Templates
  const [templates, setTemplates] = useState<RoutineTemplate[]>([]);
  const [isSaveTemplateOpen, setIsSaveTemplateOpen] = useState(false);
  const [isLoadTemplateOpen, setIsLoadTemplateOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [isCopyDayOpen, setIsCopyDayOpen] = useState(false);
  const [copyFromDay, setCopyFromDay] = useState<number | null>(null);
  const [copyToDays, setCopyToDays] = useState<number[]>([]);
  const [isShareOpen, setIsShareOpen] = useState(false);
  
  const [isResetAllOpen, setIsResetAllOpen] = useState(false);
  const [isBulkReminderOpen, setIsBulkReminderOpen] = useState(false);
  const [bulkReminderMinutes, setBulkReminderMinutes] = useState<number | null>(15);
  
  // Form data
  const [itemFormData, setItemFormData] = useState({
    title: '',
    description: '',
    days_of_week: [1] as number[],
    start_time: '',
    end_time: '',
    color: '#3b82f6',
    is_recurring: true,
    reminder_minutes: null as number | null
  });
  
  const [objectiveFormData, setObjectiveFormData] = useState({
    title: '',
    description: '',
    objective_type: 'weekly' as 'weekly' | 'daily',
    day_of_week: null as number | null,
    target_value: 1,
    color: '#10b981'
  });

  useEffect(() => {
    if (user) {
      loadRoutines();
    }
  }, [user]);

  useEffect(() => {
    if (activeRoutine) {
      loadRoutineData();
    }
  }, [activeRoutine]);

  const loadRoutines = async () => {
    if (!user) return;
    setIsLoading(true);
    
    try {
      const { data: routinesData } = await supabase
        .from('routines')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at');

      if (routinesData && routinesData.length > 0) {
        setRoutines(routinesData as Routine[]);
        const active = routinesData.find(r => r.is_active) || routinesData[0];
        setActiveRoutine(active as Routine);
      } else {
        // Auto-create a default routine and migrate existing items
        const { data: newRoutine } = await supabase
          .from('routines')
          .insert({ user_id: user.id, name: 'Minha Rotina', is_active: true })
          .select()
          .single();

        if (newRoutine) {
          // Migrate existing items without routine_id
          await supabase
            .from('routine_items')
            .update({ routine_id: newRoutine.id })
            .eq('user_id', user.id)
            .is('routine_id', null);
          await supabase
            .from('routine_objectives')
            .update({ routine_id: newRoutine.id })
            .eq('user_id', user.id)
            .is('routine_id', null);

          setRoutines([newRoutine as Routine]);
          setActiveRoutine(newRoutine as Routine);
        }
      }
    } catch (error) {
      console.error('Error loading routines:', error);
      toast.error('Erro ao carregar rotinas');
    } finally {
      setIsLoading(false);
    }
  };

  const loadRoutineData = async () => {
    if (!user || !activeRoutine) return;
    
    try {
      const [itemsRes, objectivesRes, completionsRes, templatesRes] = await Promise.all([
        supabase
          .from('routine_items')
          .select('*')
          .eq('user_id', user.id)
          .eq('routine_id', activeRoutine.id)
          .order('order_index'),
        supabase
          .from('routine_objectives')
          .select('*')
          .eq('user_id', user.id)
          .eq('routine_id', activeRoutine.id)
          .order('created_at'),
        supabase
          .from('routine_completions')
          .select('*')
          .eq('user_id', user.id)
          .gte('completion_date', format(startOfWeek(new Date(), { weekStartsOn: 0 }), 'yyyy-MM-dd')),
        supabase
          .from('routine_templates')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
      ]);
      
      if (itemsRes.data) setRoutineItems(itemsRes.data);
      if (objectivesRes.data) setObjectives(objectivesRes.data as RoutineObjective[]);
      if (completionsRes.data) setCompletions(completionsRes.data);
      if (templatesRes.data) setTemplates(templatesRes.data as RoutineTemplate[]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar dados');
    }
  };

  const loadData = () => loadRoutineData();

  const handleCreateRoutine = async () => {
    if (!user || !newRoutineName.trim()) {
      toast.error('Nome da rotina é obrigatório');
      return;
    }

    try {
      // Deactivate all other routines
      await supabase
        .from('routines')
        .update({ is_active: false })
        .eq('user_id', user.id);

      const { data, error } = await supabase
        .from('routines')
        .insert({ user_id: user.id, name: newRoutineName.trim(), is_active: true })
        .select()
        .single();

      if (error) throw error;

      setNewRoutineName('');
      setIsNewRoutineOpen(false);
      toast.success('Nova rotina criada!');
      loadRoutines();
    } catch (error) {
      console.error('Error creating routine:', error);
      toast.error('Erro ao criar rotina');
    }
  };

  const handleSwitchRoutine = async (routine: Routine) => {
    if (!user || routine.id === activeRoutine?.id) return;

    try {
      await supabase
        .from('routines')
        .update({ is_active: false })
        .eq('user_id', user.id);

      await supabase
        .from('routines')
        .update({ is_active: true })
        .eq('id', routine.id);

      setActiveRoutine(routine);
      setRoutines(prev => prev.map(r => ({ ...r, is_active: r.id === routine.id })));
    } catch (error) {
      console.error('Error switching routine:', error);
      toast.error('Erro ao trocar rotina');
    }
  };

  const handleRenameRoutine = async () => {
    if (!activeRoutine || !renameRoutineName.trim()) return;

    try {
      await supabase
        .from('routines')
        .update({ name: renameRoutineName.trim() })
        .eq('id', activeRoutine.id);

      setActiveRoutine(prev => prev ? { ...prev, name: renameRoutineName.trim() } : null);
      setRoutines(prev => prev.map(r => r.id === activeRoutine.id ? { ...r, name: renameRoutineName.trim() } : r));
      setIsRenameRoutineOpen(false);
      toast.success('Rotina renomeada!');
    } catch (error) {
      console.error('Error renaming routine:', error);
      toast.error('Erro ao renomear rotina');
    }
  };

  const handleDeleteRoutine = async (routineId: string) => {
    if (!user || routines.length <= 1) {
      toast.error('Você precisa ter pelo menos uma rotina');
      return;
    }

    try {
      await supabase.from('routines').delete().eq('id', routineId);
      
      const remaining = routines.filter(r => r.id !== routineId);
      if (activeRoutine?.id === routineId) {
        // Activate the first remaining routine
        await supabase.from('routines').update({ is_active: true }).eq('id', remaining[0].id);
        remaining[0].is_active = true;
        setActiveRoutine(remaining[0]);
      }
      setRoutines(remaining);
      toast.success('Rotina excluída!');
    } catch (error) {
      console.error('Error deleting routine:', error);
      toast.error('Erro ao excluir rotina');
    }
  };

  const handleResetAll = async () => {
    if (!user || !activeRoutine) return;
    try {
      // Uncheck all completed items (set is_completed to false)
      await supabase
        .from('routine_items')
        .update({ is_completed: false })
        .eq('user_id', user.id)
        .eq('routine_id', activeRoutine.id);

      // Delete all completions for objectives
      await supabase
        .from('routine_completions')
        .delete()
        .eq('user_id', user.id);

      // Update local state
      setRoutineItems(prev => prev.map(item => ({ ...item, is_completed: false })));
      setCompletions([]);
      setIsResetAllOpen(false);
      toast.success('Marcações resetadas! Sua rotina está pronta para recomeçar.');
    } catch (error) {
      console.error('Error resetting routine:', error);
      toast.error('Erro ao resetar marcações');
    }
  };

  const handleAddItem = async () => {
    if (!user || !itemFormData.title.trim()) {
      toast.error('Título é obrigatório');
      return;
    }
    
    try {
      const itemsToInsert = itemFormData.days_of_week.map(day => ({
        user_id: user.id,
        routine_id: activeRoutine?.id,
        title: itemFormData.title,
        description: itemFormData.description || null,
        day_of_week: day,
        start_time: itemFormData.start_time || null,
        end_time: itemFormData.end_time || null,
        color: itemFormData.color,
        is_recurring: itemFormData.is_recurring,
        reminder_minutes: itemFormData.reminder_minutes
      }));

      const { error } = await supabase
        .from('routine_items')
        .insert(itemsToInsert);
        
      if (error) throw error;
      
      toast.success(`${itemsToInsert.length > 1 ? itemsToInsert.length + ' atividades adicionadas' : 'Atividade adicionada'}!`);
      setIsAddItemDialogOpen(false);
      resetItemForm();
      loadData();
    } catch (error) {
      console.error('Error adding item:', error);
      toast.error('Erro ao adicionar atividade');
    }
  };

  const handleUpdateItem = async () => {
    if (!editingItem || !itemFormData.title.trim()) return;
    
    try {
      const originalDay = editingItem.day_of_week;
      const selectedDays = itemFormData.days_of_week;
      const commonData = {
        title: itemFormData.title,
        description: itemFormData.description || null,
        start_time: itemFormData.start_time || null,
        end_time: itemFormData.end_time || null,
        color: itemFormData.color,
        is_recurring: itemFormData.is_recurring,
        reminder_minutes: itemFormData.reminder_minutes
      };

      // Update the existing record with the first selected day
      const { error: updateError } = await supabase
        .from('routine_items')
        .update({ ...commonData, day_of_week: selectedDays[0] })
        .eq('id', editingItem.id);
        
      if (updateError) throw updateError;

      // Create new records for additional days
      const newDays = selectedDays.slice(1).filter(d => d !== originalDay);
      if (newDays.length > 0) {
        const newItems = newDays.map(day => ({
          user_id: user!.id,
          routine_id: activeRoutine?.id,
          ...commonData,
          day_of_week: day
        }));
        const { error: insertError } = await supabase
          .from('routine_items')
          .insert(newItems);
        if (insertError) throw insertError;
      }
      
      toast.success('Atividade atualizada!');
      setEditingItem(null);
      resetItemForm();
      loadData();
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error('Erro ao atualizar atividade');
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('routine_items')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      toast.success('Atividade removida!');
      loadData();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Erro ao remover atividade');
    }
  };

  const handleToggleItemComplete = async (item: RoutineItem) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const isCompleted = !item.is_completed;
    
    try {
      // Update the item
      const { error: updateError } = await supabase
        .from('routine_items')
        .update({
          is_completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null
        })
        .eq('id', item.id);
        
      if (updateError) throw updateError;
      
      // Track completion for statistics
      if (isCompleted) {
        await supabase
          .from('routine_completions')
          .insert({
            user_id: user!.id,
            routine_item_id: item.id,
            completion_date: today
          });
      } else {
        await supabase
          .from('routine_completions')
          .delete()
          .eq('routine_item_id', item.id)
          .eq('completion_date', today);
      }
      
      loadData();
    } catch (error) {
      console.error('Error toggling item:', error);
      toast.error('Erro ao atualizar atividade');
    }
  };

  const handleAddObjective = async () => {
    if (!user || !objectiveFormData.title.trim()) {
      toast.error('Título é obrigatório');
      return;
    }
    
    try {
      const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 0 }), 'yyyy-MM-dd');
      
      const { error } = await supabase
        .from('routine_objectives')
        .insert({
          user_id: user.id,
          routine_id: activeRoutine?.id,
          title: objectiveFormData.title,
          description: objectiveFormData.description || null,
          objective_type: objectiveFormData.objective_type,
          day_of_week: objectiveFormData.objective_type === 'daily' ? objectiveFormData.day_of_week : null,
          target_value: objectiveFormData.target_value,
          color: objectiveFormData.color,
          week_start: weekStart
        });
        
      if (error) throw error;
      
      toast.success('Objetivo adicionado!');
      setIsAddObjectiveDialogOpen(false);
      resetObjectiveForm();
      loadData();
    } catch (error) {
      console.error('Error adding objective:', error);
      toast.error('Erro ao adicionar objetivo');
    }
  };

  const handleUpdateObjective = async () => {
    if (!editingObjective || !objectiveFormData.title.trim()) return;
    
    try {
      const { error } = await supabase
        .from('routine_objectives')
        .update({
          title: objectiveFormData.title,
          description: objectiveFormData.description || null,
          objective_type: objectiveFormData.objective_type,
          day_of_week: objectiveFormData.objective_type === 'daily' ? objectiveFormData.day_of_week : null,
          target_value: objectiveFormData.target_value,
          color: objectiveFormData.color
        })
        .eq('id', editingObjective.id);
        
      if (error) throw error;
      
      toast.success('Objetivo atualizado!');
      setEditingObjective(null);
      resetObjectiveForm();
      loadData();
    } catch (error) {
      console.error('Error updating objective:', error);
      toast.error('Erro ao atualizar objetivo');
    }
  };

  const handleDeleteObjective = async (id: string) => {
    try {
      const { error } = await supabase
        .from('routine_objectives')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      toast.success('Objetivo removido!');
      loadData();
    } catch (error) {
      console.error('Error deleting objective:', error);
      toast.error('Erro ao remover objetivo');
    }
  };

  const handleIncrementObjective = async (objective: RoutineObjective) => {
    const newValue = Math.min(objective.current_value + 1, objective.target_value);
    await handleSetObjectiveValue(objective, newValue);
  };

  const handleSetObjectiveValue = async (objective: RoutineObjective, newValue: number) => {
    const clampedValue = Math.max(0, Math.min(newValue, objective.target_value));
    const isCompleted = clampedValue >= objective.target_value;
    
    try {
      const { error } = await supabase
        .from('routine_objectives')
        .update({
          current_value: clampedValue,
          is_completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null
        })
        .eq('id', objective.id);
        
      if (error) throw error;
      
      if (isCompleted) {
        toast.success('🎉 Objetivo concluído!');
      }
      
      loadData();
    } catch (error) {
      console.error('Error updating objective:', error);
      toast.error('Erro ao atualizar objetivo');
    }
  };

  const resetItemForm = () => {
    setItemFormData({
      title: '',
      description: '',
      days_of_week: [1],
      start_time: '',
      end_time: '',
      color: '#3b82f6',
      is_recurring: true,
      reminder_minutes: null
    });
  };

  const resetObjectiveForm = () => {
    setObjectiveFormData({
      title: '',
      description: '',
      objective_type: 'weekly',
      day_of_week: null,
      target_value: 1,
      color: '#10b981'
    });
  };

  const openEditItem = (item: RoutineItem) => {
    setEditingItem(item);
    setItemFormData({
      title: item.title,
      description: item.description || '',
      days_of_week: [item.day_of_week],
      start_time: item.start_time || '',
      end_time: item.end_time || '',
      color: item.color,
      is_recurring: item.is_recurring,
      reminder_minutes: item.reminder_minutes
    });
  };

  const openEditObjective = (objective: RoutineObjective) => {
    setEditingObjective(objective);
    setObjectiveFormData({
      title: objective.title,
      description: objective.description || '',
      objective_type: objective.objective_type,
      day_of_week: objective.day_of_week,
      target_value: objective.target_value,
      color: objective.color
    });
  };

  const getItemsByDay = (dayOfWeek: number) => {
    return routineItems.filter(item => item.day_of_week === dayOfWeek).sort((a, b) => {
      // Sort by start_time first, then by order_index for items without time
      if (a.start_time && b.start_time) return a.start_time.localeCompare(b.start_time);
      if (a.start_time && !b.start_time) return -1;
      if (!a.start_time && b.start_time) return 1;
      return a.order_index - b.order_index;
    });
  };

  const handleDragEndDay = async (dayOfWeek: number, event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    
    const items = getItemsByDay(dayOfWeek);
    const oldIndex = items.findIndex(i => i.id === active.id);
    const newIndex = items.findIndex(i => i.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const reordered = arrayMove(items, oldIndex, newIndex);
    
    // Update local state optimistically
    setRoutineItems(prev => {
      const otherItems = prev.filter(i => i.day_of_week !== dayOfWeek);
      return [...otherItems, ...reordered.map((item, idx) => ({ ...item, order_index: idx }))];
    });

    try {
      await Promise.all(
        reordered.map((item, idx) =>
          supabase.from('routine_items').update({ order_index: idx }).eq('id', item.id)
        )
      );
    } catch (error) {
      console.error('Error reordering:', error);
      toast.error('Erro ao reordenar atividade');
      loadData();
    }
  };

  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Template handlers
  const handleSaveTemplate = async () => {
    if (!user || !templateName.trim()) {
      toast.error('Nome do modelo é obrigatório');
      return;
    }

    const templateItems = routineItems.map(item => ({
      title: item.title,
      description: item.description,
      day_of_week: item.day_of_week,
      start_time: item.start_time,
      end_time: item.end_time,
      color: item.color,
      is_recurring: item.is_recurring,
      reminder_minutes: item.reminder_minutes,
      order_index: item.order_index,
    }));

    try {
      const { error } = await supabase.from('routine_templates').insert({
        user_id: user.id,
        name: templateName.trim(),
        items: templateItems,
      });
      if (error) throw error;
      toast.success('Modelo salvo com sucesso!');
      setTemplateName('');
      setIsSaveTemplateOpen(false);
      loadData();
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Erro ao salvar modelo');
    }
  };

  const handleApplyTemplate = async (template: RoutineTemplate) => {
    if (!user) return;

    try {
      // Delete existing items for this routine
      await supabase.from('routine_items').delete().eq('user_id', user.id).eq('routine_id', activeRoutine?.id);

      // Insert template items
      const newItems = (template.items as any[]).map((item, idx) => ({
        user_id: user.id,
        routine_id: activeRoutine?.id,
        title: item.title,
        description: item.description,
        day_of_week: item.day_of_week,
        start_time: item.start_time,
        end_time: item.end_time,
        color: item.color,
        is_recurring: item.is_recurring ?? true,
        reminder_minutes: item.reminder_minutes,
        order_index: item.order_index ?? idx,
      }));

      if (newItems.length > 0) {
        const { error } = await supabase.from('routine_items').insert(newItems);
        if (error) throw error;
      }

      toast.success('Modelo aplicado com sucesso!');
      setIsLoadTemplateOpen(false);
      loadData();
    } catch (error) {
      console.error('Error applying template:', error);
      toast.error('Erro ao aplicar modelo');
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      const { error } = await supabase.from('routine_templates').delete().eq('id', templateId);
      if (error) throw error;
      toast.success('Modelo excluído');
      loadData();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Erro ao excluir modelo');
    }
  };

  const handleCopyDay = async () => {
    if (!user || copyFromDay === null || copyToDays.length === 0) {
      toast.error('Selecione o dia de origem e os dias de destino');
      return;
    }

    const sourceItems = getItemsByDay(copyFromDay);
    if (sourceItems.length === 0) {
      toast.error('O dia selecionado não tem atividades');
      return;
    }

    try {
      for (const targetDay of copyToDays) {
        await supabase.from('routine_items').delete().eq('user_id', user.id).eq('routine_id', activeRoutine?.id).eq('day_of_week', targetDay);
      }

      const newItems = copyToDays.flatMap(targetDay =>
        sourceItems.map((item, idx) => ({
          user_id: user.id,
          routine_id: activeRoutine?.id,
          title: item.title,
          description: item.description,
          day_of_week: targetDay,
          start_time: item.start_time,
          end_time: item.end_time,
          color: item.color,
          is_recurring: item.is_recurring,
          reminder_minutes: item.reminder_minutes,
          order_index: idx,
        }))
      );

      const { error } = await supabase.from('routine_items').insert(newItems);
      if (error) throw error;

      toast.success(`Atividades copiadas para ${copyToDays.length} dia(s)!`);
      setIsCopyDayOpen(false);
      setCopyFromDay(null);
      setCopyToDays([]);
      loadData();
    } catch (error) {
      console.error('Error copying day:', error);
      toast.error('Erro ao copiar atividades');
    }
  };


  // Sharing functions
  const handleBulkSetReminders = async () => {
    if (!user || !activeRoutine || routineItems.length === 0) return;

    try {
      const { error } = await supabase
        .from('routine_items')
        .update({ reminder_minutes: bulkReminderMinutes })
        .eq('user_id', user.id)
        .eq('routine_id', activeRoutine.id);

      if (error) throw error;

      toast.success(`Lembretes configurados para ${routineItems.length} atividades!`);
      setIsBulkReminderOpen(false);
      loadData();
    } catch (error) {
      console.error('Error setting bulk reminders:', error);
      toast.error('Erro ao configurar lembretes em massa');
    }
  };

  const generateRoutineText = () => {
    let text = '📅 MINHA ROTINA SEMANAL\n\n';
    DAYS_OF_WEEK.forEach(day => {
      const items = getItemsByDay(day.value);
      if (items.length > 0) {
        text += `📌 ${day.label}\n`;
        items.forEach(item => {
          const time = item.start_time ? ` (${item.start_time}${item.end_time ? '-' + item.end_time : ''})` : '';
          const status = item.is_completed ? '✅' : '⬜';
          text += `  ${status} ${item.title}${time}\n`;
        });
        text += '\n';
      }
    });
    
    if (objectives.length > 0) {
      text += '🎯 OBJETIVOS\n';
      objectives.forEach(obj => {
        const progress = Math.round((obj.current_value / obj.target_value) * 100);
        text += `  ${obj.is_completed ? '✅' : '⬜'} ${obj.title} (${progress}%)\n`;
      });
    }
    
    return text;
  };

  const handleCopyRoutineText = () => {
    navigator.clipboard.writeText(generateRoutineText());
    toast.success('Rotina copiada!');
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(generateRoutineText());
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleDownloadPDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      const margin = 15;
      let y = 20;

      doc.setFontSize(18);
      doc.text('Minha Rotina Semanal', margin, y);
      y += 12;

      DAYS_OF_WEEK.forEach(day => {
        const items = getItemsByDay(day.value);
        if (items.length === 0) return;

        if (y > 260) { doc.addPage(); y = 20; }
        
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text(day.label, margin, y);
        y += 7;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        items.forEach(item => {
          if (y > 275) { doc.addPage(); y = 20; }
          const time = item.start_time ? ` (${item.start_time}${item.end_time ? '-' + item.end_time : ''})` : '';
          const status = item.is_completed ? '[x]' : '[ ]';
          doc.text(`${status} ${item.title}${time}`, margin + 5, y);
          y += 5;
        });
        y += 4;
      });

      if (objectives.length > 0) {
        if (y > 250) { doc.addPage(); y = 20; }
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text('Objetivos', margin, y);
        y += 7;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        objectives.forEach(obj => {
          if (y > 275) { doc.addPage(); y = 20; }
          const progress = Math.round((obj.current_value / obj.target_value) * 100);
          doc.text(`${obj.is_completed ? '[x]' : '[ ]'} ${obj.title} - ${progress}%`, margin + 5, y);
          y += 5;
        });
      }

      doc.save('minha-rotina.pdf');
      toast.success('PDF baixado!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Erro ao gerar PDF');
    }
  };

  const handleShareEmail = () => {
    const subject = encodeURIComponent('Minha Rotina Semanal');
    const body = encodeURIComponent(generateRoutineText());
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const getWeeklyObjectives = () => objectives.filter(o => o.objective_type === 'weekly');
  const getDailyObjectives = (dayOfWeek: number) => objectives.filter(o => o.objective_type === 'daily' && o.day_of_week === dayOfWeek);

  // Statistics
  const totalItems = routineItems.length;
  const completedItemsToday = routineItems.filter(item => {
    const today = new Date().getDay();
    return item.day_of_week === today && item.is_completed;
  }).length;
  const todayItems = routineItems.filter(item => item.day_of_week === new Date().getDay()).length;
  const completionRate = todayItems > 0 ? Math.round((completedItemsToday / todayItems) * 100) : 0;
  
  const weeklyCompletions = completions.length;
  const totalObjectivesCompleted = objectives.filter(o => o.is_completed).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/30 p-4 rounded-xl border border-border/50">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-primary/10 text-primary">
              <Calendar className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Organizador de Rotina</h2>
              <p className="text-sm text-muted-foreground">Planeje e acompanhe sua evolução semanal</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 bg-background p-2 rounded-lg border border-border shadow-sm w-full sm:w-auto">
            <div className="flex items-center gap-2 flex-1 sm:flex-initial px-2">
              <span className="text-sm font-semibold text-primary truncate max-w-[120px] md:max-w-[200px]" title={activeRoutine?.name}>
                {activeRoutine?.name}
              </span>
              <div className="flex gap-0.5">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setRenameRoutineName(activeRoutine?.name || '');
                    setIsRenameRoutineOpen(true);
                  }}
                  title="Renomear Rotina"
                >
                  <Edit className="h-3.5 w-3.5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => setIsResetAllOpen(true)}
                  title="Reiniciar Semana"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
                {routines.length > 1 && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => {
                      if (activeRoutine) {
                        setRoutineToDelete(activeRoutine.id);
                        setDeleteConfirmationText('');
                        setIsDeleteRoutineOpen(true);
                      }
                    }}
                    title="Excluir Rotina"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>

            <div className="h-6 w-px bg-border hidden sm:block" />

            <Dialog open={isNewRoutineOpen} onOpenChange={setIsNewRoutineOpen}>
              <DialogTrigger asChild>
                <Button variant="default" size="sm" className="gap-2 font-bold bg-primary hover:bg-primary/90 shadow-sm whitespace-nowrap">
                  <ListPlus className="h-3.5 w-3.5" />
                  Criador de Rotina
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nova Rotina</DialogTitle>
                  <DialogDescription>Crie uma nova rotina para organizar suas atividades</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Label>Nome da Rotina</Label>
                  <Input 
                    placeholder="Ex: Minha Rotina, Trabalho, Estudos..." 
                    value={newRoutineName}
                    onChange={(e) => setNewRoutineName(e.target.value)}
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsNewRoutineOpen(false)}>Cancelar</Button>
                  <Button onClick={handleCreateRoutine}>Criar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isDeleteRoutineOpen} onOpenChange={setIsDeleteRoutineOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="text-destructive flex items-center gap-2">
                    <Trash2 className="h-5 w-5" />
                    Excluir Rotina
                  </DialogTitle>
                  <DialogDescription>
                    Esta ação é permanente e excluirá todas as atividades desta rotina.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <p className="text-sm font-medium">
                    Para confirmar, digite <span className="font-bold text-destructive">excluir</span> no campo abaixo:
                  </p>
                  <Input 
                    placeholder="Digite excluir para confirmar" 
                    value={deleteConfirmationText}
                    onChange={(e) => setDeleteConfirmationText(e.target.value)}
                    className={deleteConfirmationText === 'excluir' ? 'border-destructive focus-visible:ring-destructive' : ''}
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDeleteRoutineOpen(false)}>Cancelar</Button>
                  <Button 
                    variant="destructive" 
                    disabled={deleteConfirmationText !== 'excluir'}
                    onClick={() => {
                      if (routineToDelete) {
                        handleDeleteRoutine(routineToDelete);
                        setIsDeleteRoutineOpen(false);
                      }
                    }}
                  >
                    Excluir Permanentemente
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {routines.length > 1 && (
              <Select value={activeRoutine?.id} onValueChange={(id) => {
                const routine = routines.find(r => r.id === id);
                if (routine) handleSwitchRoutine(routine);
              }}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue placeholder="Trocar" />
                </SelectTrigger>
                <SelectContent>
                  {routines.map(routine => (
                    <SelectItem key={routine.id} value={routine.id} className="text-xs">
                      {routine.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <div className="flex gap-1 flex-wrap justify-end">
          <Dialog open={isBulkReminderOpen} onOpenChange={setIsBulkReminderOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" disabled={routineItems.length === 0} title="Lembrete em Massa">
                <Bell className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Configurar Lembretes em Massa</DialogTitle>
                <DialogDescription>Defina um lembrete padrão para todas as {routineItems.length} atividades desta rotina.</DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div>
                  <Label>Tempo do Lembrete</Label>
                  <Select
                    value={bulkReminderMinutes?.toString() || 'null'}
                    onValueChange={(v) => setBulkReminderMinutes(v === 'null' ? null : parseInt(v))}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REMINDER_OPTIONS.map(opt => (
                        <SelectItem key={opt.value || 'null'} value={opt.value?.toString() || 'null'}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                  Isso atualizará <strong>todas</strong> as atividades da rotina atual ({activeRoutine?.name}) para o tempo selecionado.
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsBulkReminderOpen(false)}>Cancelar</Button>
                <Button onClick={handleBulkSetReminders}>Aplicar a Todos</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Template buttons */}
          <Dialog open={isSaveTemplateOpen} onOpenChange={setIsSaveTemplateOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" disabled={routineItems.length === 0} title="Salvar Modelo">
                <Save className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Salvar Modelo de Semana</DialogTitle>
                <DialogDescription>Salve sua configuração atual como modelo para reutilizar</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Nome do Modelo *</Label>
                  <Input
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="Ex: Semana produtiva, Semana light..."
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  <FileText className="inline h-3 w-3 mr-1" />
                  {routineItems.length} atividade(s) serão salvas neste modelo
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsSaveTemplateOpen(false)}>Cancelar</Button>
                <Button onClick={handleSaveTemplate}>Salvar Modelo</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isLoadTemplateOpen} onOpenChange={setIsLoadTemplateOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" disabled={templates.length === 0} title={`Modelos (${templates.length})`}>
                <FolderOpen className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Modelos de Semana</DialogTitle>
                <DialogDescription>Selecione um modelo para aplicar. Isso substituirá todas as atividades atuais.</DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[400px]">
                <div className="space-y-3">
                  {templates.map(template => (
                    <Card key={template.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{template.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(template.items as any[]).length} atividades · Salvo em {format(new Date(template.created_at), "dd/MM/yyyy", { locale: ptBR })}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button size="sm" onClick={() => handleApplyTemplate(template)}>
                              <Copy className="mr-1 h-3 w-3" />
                              Aplicar
                            </Button>
                            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDeleteTemplate(template.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>

          {/* Copy Day Dialog */}
          <Dialog open={isCopyDayOpen} onOpenChange={(open) => { setIsCopyDayOpen(open); if (!open) { setCopyFromDay(null); setCopyToDays([]); } }}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" title="Copiar Dia">
                <Copy className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Copiar Atividades de um Dia</DialogTitle>
                <DialogDescription>Escolha o dia de origem e os dias de destino para copiar as atividades</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Copiar de:</Label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {DAYS_OF_WEEK.map(day => {
                      const count = getItemsByDay(day.value).length;
                      return (
                        <Button
                          key={day.value}
                          variant={copyFromDay === day.value ? "default" : "outline"}
                          size="sm"
                          className="text-xs"
                          onClick={() => {
                            setCopyFromDay(day.value);
                            setCopyToDays(prev => prev.filter(d => d !== day.value));
                          }}
                        >
                          {day.short} ({count})
                        </Button>
                      );
                    })}
                  </div>
                </div>
                {copyFromDay !== null && (
                  <div>
                    <Label>Colar em:</Label>
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {DAYS_OF_WEEK.filter(d => d.value !== copyFromDay).map(day => (
                        <Button
                          key={day.value}
                          variant={copyToDays.includes(day.value) ? "default" : "outline"}
                          size="sm"
                          className="text-xs"
                          onClick={() => {
                            setCopyToDays(prev =>
                              prev.includes(day.value)
                                ? prev.filter(d => d !== day.value)
                                : [...prev, day.value]
                            );
                          }}
                        >
                          {day.short}
                        </Button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      ⚠️ As atividades existentes nos dias de destino serão substituídas
                    </p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCopyDayOpen(false)}>Cancelar</Button>
                <Button onClick={handleCopyDay} disabled={copyFromDay === null || copyToDays.length === 0}>
                  Copiar Atividades
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Share Dialog */}
          <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" disabled={routineItems.length === 0} title="Compartilhar">
                <Share2 className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Copiar Atividades de um Dia</DialogTitle>
                <DialogDescription>Escolha o dia de origem e os dias de destino para copiar as atividades</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Copiar de:</Label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {DAYS_OF_WEEK.map(day => {
                      const count = getItemsByDay(day.value).length;
                      return (
                        <Button
                          key={day.value}
                          variant={copyFromDay === day.value ? "default" : "outline"}
                          size="sm"
                          className="text-xs"
                          onClick={() => {
                            setCopyFromDay(day.value);
                            setCopyToDays(prev => prev.filter(d => d !== day.value));
                          }}
                        >
                          {day.short} ({count})
                        </Button>
                      );
                    })}
                  </div>
                </div>
                {copyFromDay !== null && (
                  <div>
                    <Label>Colar em:</Label>
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {DAYS_OF_WEEK.filter(d => d.value !== copyFromDay).map(day => (
                        <Button
                          key={day.value}
                          variant={copyToDays.includes(day.value) ? "default" : "outline"}
                          size="sm"
                          className="text-xs"
                          onClick={() => {
                            setCopyToDays(prev =>
                              prev.includes(day.value)
                                ? prev.filter(d => d !== day.value)
                                : [...prev, day.value]
                            );
                          }}
                        >
                          {day.short}
                        </Button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      ⚠️ As atividades existentes nos dias de destino serão substituídas
                    </p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCopyDayOpen(false)}>Cancelar</Button>
                <Button onClick={handleCopyDay} disabled={copyFromDay === null || copyToDays.length === 0}>
                  Copiar para {copyToDays.length} dia(s)
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddItemDialogOpen} onOpenChange={setIsAddItemDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova Atividade
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Atividade</DialogTitle>
                <DialogDescription>Crie uma nova atividade na sua rotina</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Título *</Label>
                  <Input
                    value={itemFormData.title}
                    onChange={(e) => setItemFormData({ ...itemFormData, title: e.target.value })}
                    placeholder="Ex: Exercício matinal"
                  />
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Textarea
                    value={itemFormData.description}
                    onChange={(e) => setItemFormData({ ...itemFormData, description: e.target.value })}
                    placeholder="Detalhes da atividade..."
                  />
                </div>
                <div>
                  <Label>Dias da Semana</Label>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={itemFormData.days_of_week.length === 7}
                        onCheckedChange={(checked) => {
                          setItemFormData(prev => ({
                            ...prev,
                            days_of_week: checked ? [0,1,2,3,4,5,6] : []
                          }));
                        }}
                      />
                      <Label className="text-sm font-medium">Semana toda</Label>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {DAYS_OF_WEEK.map(day => (
                        <div key={day.value} className="flex items-center gap-2">
                          <Checkbox
                            checked={itemFormData.days_of_week.includes(day.value)}
                            onCheckedChange={(checked) => {
                              setItemFormData(prev => ({
                                ...prev,
                                days_of_week: checked
                                  ? [...prev.days_of_week, day.value]
                                  : prev.days_of_week.filter(d => d !== day.value)
                              }));
                            }}
                          />
                          <Label className="text-sm">{day.short}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Horário Início</Label>
                    <Input
                      type="time"
                      value={itemFormData.start_time}
                      onChange={(e) => setItemFormData({ ...itemFormData, start_time: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Horário Fim</Label>
                    <Input
                      type="time"
                      value={itemFormData.end_time}
                      onChange={(e) => setItemFormData({ ...itemFormData, end_time: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label>Lembrete</Label>
                  <Select
                    value={itemFormData.reminder_minutes?.toString() || 'null'}
                    onValueChange={(v) => setItemFormData({ ...itemFormData, reminder_minutes: v === 'null' ? null : parseInt(v) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REMINDER_OPTIONS.map(opt => (
                        <SelectItem key={opt.value || 'null'} value={opt.value?.toString() || 'null'}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Cor</Label>
                  <div className="flex gap-2 mt-2">
                    {COLORS.map(color => (
                      <button
                        key={color}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${itemFormData.color === color ? 'border-foreground scale-110' : 'border-transparent'}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setItemFormData({ ...itemFormData, color })}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Recorrente (toda semana)</Label>
                  <Switch
                    checked={itemFormData.is_recurring}
                    onCheckedChange={(checked) => setItemFormData({ ...itemFormData, is_recurring: checked })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddItemDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleAddItem}>Adicionar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <div className="flex items-center gap-2 border-l border-border pl-2 ml-1">
            <Dialog open={isAddObjectiveDialogOpen} onOpenChange={setIsAddObjectiveDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 border-primary/20 text-primary hover:bg-primary/5">
                  <Target className="h-4 w-4" />
                  Novo Objetivo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Objetivo</DialogTitle>
                  <DialogDescription>Defina uma meta para acompanhar</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Título *</Label>
                    <Input
                      value={objectiveFormData.title}
                      onChange={(e) => setObjectiveFormData({ ...objectiveFormData, title: e.target.value })}
                      placeholder="Ex: Beber 2L de água"
                    />
                  </div>
                  <div>
                    <Label>Descrição</Label>
                    <Textarea
                      value={objectiveFormData.description}
                      onChange={(e) => setObjectiveFormData({ ...objectiveFormData, description: e.target.value })}
                      placeholder="Detalhes do objetivo..."
                    />
                  </div>
                  <div>
                    <Label>Frequência</Label>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={objectiveFormData.objective_type === 'weekly'}
                          onCheckedChange={(checked) => {
                            setObjectiveFormData(prev => ({
                              ...prev,
                              objective_type: checked ? 'weekly' : 'daily',
                              day_of_week: checked ? null : new Date().getDay()
                            }));
                          }}
                        />
                        <Label className="text-sm font-medium">Semanal (acumulativo)</Label>
                      </div>
                      {objectiveFormData.objective_type === 'daily' && (
                        <div className="grid grid-cols-4 gap-2">
                          {DAYS_OF_WEEK.map(day => (
                            <div key={day.value} className="flex items-center gap-2">
                              <Checkbox
                                checked={objectiveFormData.day_of_week === day.value}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setObjectiveFormData(prev => ({
                                      ...prev,
                                      day_of_week: day.value
                                    }));
                                  }
                                }}
                              />
                              <Label className="text-sm">{day.short}</Label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label>Meta (quantidade)</Label>
                    <Input
                      type="number"
                      min={1}
                      value={objectiveFormData.target_value}
                      onChange={(e) => setObjectiveFormData({ ...objectiveFormData, target_value: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div>
                    <Label>Color</Label>
                    <div className="flex gap-2 mt-2">
                      {COLORS.map(color => (
                        <button
                          key={color}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${objectiveFormData.color === color ? 'border-foreground scale-110' : 'border-transparent'}`}
                          style={{ backgroundColor: color }}
                          onClick={() => setObjectiveFormData({ ...objectiveFormData, color })}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddObjectiveDialogOpen(false)}>Cancelar</Button>
                  <Button onClick={handleAddObjective}>Adicionar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="glass">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Hoje</p>
                <p className="text-2xl font-bold">{completionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-500/10">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Feitas Hoje</p>
                <p className="text-2xl font-bold">{completedItemsToday}/{todayItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-500/10">
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Semana</p>
                <p className="text-2xl font-bold">{weeklyCompletions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-yellow-500/10">
                <Award className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Objetivos</p>
                <p className="text-2xl font-bold">{totalObjectivesCompleted}/{objectives.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Objectives */}
      {getWeeklyObjectives().length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Objetivos Semanais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {getWeeklyObjectives().map(objective => (
                <Card key={objective.id} className="relative overflow-hidden">
                  <div 
                    className="absolute top-0 left-0 h-1 w-full"
                    style={{ backgroundColor: objective.color }}
                  />
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium">{objective.title}</h4>
                        {objective.description && (
                          <p className="text-sm text-muted-foreground">{objective.description}</p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => openEditObjective(objective)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => handleDeleteObjective(objective.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{objective.current_value} / {objective.target_value}</span>
                        <span>{Math.round((objective.current_value / objective.target_value) * 100)}%</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {Array.from({ length: objective.target_value }, (_, i) => i + 1).map(step => (
                          <button
                            key={step}
                            onClick={() => handleSetObjectiveValue(objective, step === objective.current_value ? step - 1 : step)}
                            className={`flex items-center justify-center rounded-md border text-[10px] font-medium transition-colors min-w-[28px] h-7 px-1 ${
                              step <= objective.current_value
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
                            }`}
                          >
                            {step <= objective.current_value ? <CheckCircle2 className="h-3 w-3" /> : step}
                          </button>
                        ))}
                      </div>
                      <Progress 
                        value={(objective.current_value / objective.target_value) * 100} 
                        className="h-1.5"
                      />
                      {objective.is_completed && (
                        <Badge className="w-full justify-center bg-green-500">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Concluído!
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weekly View */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="weekly">Visão Semanal</TabsTrigger>
          <TabsTrigger value="today">Hoje</TabsTrigger>
        </TabsList>
        
        <TabsContent value="weekly" className="mt-4">
          <div
            className="overflow-x-auto cursor-grab active:cursor-grabbing select-none"
            onMouseDown={(e) => {
              const el = e.currentTarget;
              el.dataset.isDragging = 'false';
              el.dataset.startX = String(e.pageX - el.offsetLeft);
              el.dataset.scrollLeft = String(el.scrollLeft);
              const onMouseMove = (ev: MouseEvent) => {
                const x = ev.pageX - el.offsetLeft;
                const walk = (x - Number(el.dataset.startX)) * 1.5;
                el.scrollLeft = Number(el.dataset.scrollLeft) - walk;
                el.dataset.isDragging = 'true';
              };
              const onMouseUp = () => {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
              };
              document.addEventListener('mousemove', onMouseMove);
              document.addEventListener('mouseup', onMouseUp);
            }}
          >
          <div className="flex gap-4 pb-4" style={{ minWidth: 'max-content' }}>
            {DAYS_OF_WEEK.map(day => {
              const items = getItemsByDay(day.value);
              const dailyObjectives = getDailyObjectives(day.value);
              const isCurrentDay = new Date().getDay() === day.value;
              
              return (
                <Card 
                  key={day.value} 
                  className={`w-[320px] flex-shrink-0 ${isCurrentDay ? 'ring-2 ring-primary' : ''}`}
                >
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-base font-semibold flex items-center justify-between">
                      <span className={isCurrentDay ? 'text-primary' : ''}>{day.short}</span>
                      {isCurrentDay && (
                        <Badge variant="secondary" className="text-xs">Hoje</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <ScrollArea className="h-[500px]">
                      <div className="space-y-2">
                        {/* Daily Objectives */}
                        {dailyObjectives.map(obj => (
                          <div 
                            key={obj.id}
                            className="p-2 rounded-md text-xs"
                            style={{ backgroundColor: `${obj.color}20`, borderLeft: `3px solid ${obj.color}` }}
                          >
                            <span className="font-medium text-wrap break-words">{obj.title}</span>
                            <div className="flex flex-wrap gap-0.5 mt-1">
                              {Array.from({ length: obj.target_value }, (_, i) => i + 1).map(step => (
                                <button
                                  key={step}
                                  onClick={() => handleSetObjectiveValue(obj, step === obj.current_value ? step - 1 : step)}
                                  className={`flex items-center justify-center rounded text-[8px] font-medium transition-colors min-w-[20px] h-5 px-0.5 ${
                                    step <= obj.current_value
                                      ? 'bg-primary text-primary-foreground'
                                      : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                                  }`}
                                >
                                  {step <= obj.current_value ? '✓' : step}
                                </button>
                              ))}
                            </div>
                            <div className="flex items-center gap-1 mt-1">
                              <Progress 
                                value={(obj.current_value / obj.target_value) * 100} 
                                className="h-1 flex-1"
                              />
                              <span className="text-[10px]">{obj.current_value}/{obj.target_value}</span>
                            </div>
                          </div>
                        ))}
                        
                        {/* Routine Items with Drag and Drop */}
                        <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEndDay(day.value, e)}>
                          <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                            {items.map(item => (
                              <SortableRoutineItem
                                key={item.id}
                                item={item}
                                onToggleComplete={handleToggleItemComplete}
                                onEdit={openEditItem}
                                onDelete={handleDeleteItem}
                              />
                            ))}
                          </SortableContext>
                        </DndContext>
                        {items.length === 0 && dailyObjectives.length === 0 && (
                          <p className="text-xs text-muted-foreground text-center py-4">
                            Nenhuma atividade
                          </p>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          </div>
        </TabsContent>
        
        <TabsContent value="today" className="mt-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Atividades de Hoje
                </CardTitle>
                <CardDescription>
                  {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {getItemsByDay(new Date().getDay()).map(item => (
                    <div
                      key={item.id}
                      className={`p-4 rounded-lg transition-all ${item.is_completed ? 'opacity-60' : ''}`}
                      style={{ backgroundColor: `${item.color}15`, borderLeft: `4px solid ${item.color}` }}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={item.is_completed}
                          onCheckedChange={() => handleToggleItemComplete(item)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <h4 className={`font-medium ${item.is_completed ? 'line-through' : ''}`}>
                            {item.title}
                          </h4>
                          {item.description && (
                            <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                          )}
                          {item.start_time && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-2">
                              <Clock className="h-3 w-3" />
                              {item.start_time}{item.end_time && ` - ${item.end_time}`}
                            </p>
                          )}
                          <div className="flex gap-2 mt-2">
                            {item.is_recurring && (
                              <Badge variant="outline" className="text-xs">
                                <RefreshCw className="h-3 w-3 mr-1" />
                                Recorrente
                              </Badge>
                            )}
                            {item.reminder_minutes && (
                              <Badge variant="outline" className="text-xs">
                                <Bell className="h-3 w-3 mr-1" />
                                {item.reminder_minutes}min antes
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditItem(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => handleDeleteItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {getItemsByDay(new Date().getDay()).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Nenhuma atividade para hoje</p>
                      <Button
                        variant="link"
                        onClick={() => {
                          setItemFormData(prev => ({ ...prev, day_of_week: new Date().getDay() }));
                          setIsAddItemDialogOpen(true);
                        }}
                      >
                        Adicionar atividade
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Objetivos do Dia
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getDailyObjectives(new Date().getDay()).map(objective => (
                    <div
                      key={objective.id}
                      className="p-4 rounded-lg"
                      style={{ backgroundColor: `${objective.color}15`, borderLeft: `4px solid ${objective.color}` }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{objective.title}</h4>
                          {objective.description && (
                            <p className="text-sm text-muted-foreground">{objective.description}</p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditObjective(objective)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => handleDeleteObjective(objective.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progresso: {objective.current_value}/{objective.target_value}</span>
                          <span>{Math.round((objective.current_value / objective.target_value) * 100)}%</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {Array.from({ length: objective.target_value }, (_, i) => i + 1).map(step => (
                            <button
                              key={step}
                              onClick={() => handleSetObjectiveValue(objective, step === objective.current_value ? step - 1 : step)}
                              className={`flex items-center justify-center rounded-md border text-xs font-medium transition-colors min-w-[32px] h-8 px-1.5 ${
                                step <= objective.current_value
                                  ? 'bg-primary text-primary-foreground border-primary'
                                  : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
                              }`}
                            >
                              {step <= objective.current_value ? <CheckCircle2 className="h-3.5 w-3.5" /> : step}
                            </button>
                          ))}
                        </div>
                        <Progress 
                          value={(objective.current_value / objective.target_value) * 100}
                          className="h-1.5"
                        />
                        {objective.is_completed && (
                          <Badge className="w-full justify-center bg-green-500">
                            <CheckCircle2 className="mr-1 h-4 w-4" />
                            Objetivo Concluído!
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  {getDailyObjectives(new Date().getDay()).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Nenhum objetivo diário para hoje</p>
                      <Button
                        variant="link"
                        onClick={() => {
                          setObjectiveFormData(prev => ({ 
                            ...prev, 
                            objective_type: 'daily',
                            day_of_week: new Date().getDay() 
                          }));
                          setIsAddObjectiveDialogOpen(true);
                        }}
                      >
                        Adicionar objetivo
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Item Dialog */}
      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Atividade</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Título *</Label>
              <Input
                value={itemFormData.title}
                onChange={(e) => setItemFormData({ ...itemFormData, title: e.target.value })}
              />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea
                value={itemFormData.description}
                onChange={(e) => setItemFormData({ ...itemFormData, description: e.target.value })}
              />
            </div>
            <div>
              <Label>Dias da Semana</Label>
              <div className="mt-2 space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={itemFormData.days_of_week.length === 7}
                    onCheckedChange={(checked) => {
                      setItemFormData(prev => ({
                        ...prev,
                        days_of_week: checked ? [0,1,2,3,4,5,6] : []
                      }));
                    }}
                  />
                  <Label className="text-sm font-medium">Semana toda</Label>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {DAYS_OF_WEEK.map(day => (
                    <div key={day.value} className="flex items-center gap-2">
                      <Checkbox
                        checked={itemFormData.days_of_week.includes(day.value)}
                        onCheckedChange={(checked) => {
                          setItemFormData(prev => {
                            const newDays = checked
                              ? [...prev.days_of_week, day.value]
                              : prev.days_of_week.filter(d => d !== day.value);
                            return { ...prev, days_of_week: newDays.length > 0 ? newDays : [day.value] };
                          });
                        }}
                      />
                      <Label className="text-sm">{day.short}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Horário Início</Label>
                <Input
                  type="time"
                  value={itemFormData.start_time}
                  onChange={(e) => setItemFormData({ ...itemFormData, start_time: e.target.value })}
                />
              </div>
              <div>
                <Label>Horário Fim</Label>
                <Input
                  type="time"
                  value={itemFormData.end_time}
                  onChange={(e) => setItemFormData({ ...itemFormData, end_time: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Lembrete</Label>
              <Select
                value={itemFormData.reminder_minutes?.toString() || 'null'}
                onValueChange={(v) => setItemFormData({ ...itemFormData, reminder_minutes: v === 'null' ? null : parseInt(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REMINDER_OPTIONS.map(opt => (
                    <SelectItem key={opt.value || 'null'} value={opt.value?.toString() || 'null'}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Cor</Label>
              <div className="flex gap-2 mt-2">
                {COLORS.map(color => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${itemFormData.color === color ? 'border-foreground scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setItemFormData({ ...itemFormData, color })}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Recorrente</Label>
              <Switch
                checked={itemFormData.is_recurring}
                onCheckedChange={(checked) => setItemFormData({ ...itemFormData, is_recurring: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingItem(null)}>Cancelar</Button>
            <Button onClick={handleUpdateItem}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Objective Dialog */}
      <Dialog open={!!editingObjective} onOpenChange={(open) => !open && setEditingObjective(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Objetivo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Título *</Label>
              <Input
                value={objectiveFormData.title}
                onChange={(e) => setObjectiveFormData({ ...objectiveFormData, title: e.target.value })}
              />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea
                value={objectiveFormData.description}
                onChange={(e) => setObjectiveFormData({ ...objectiveFormData, description: e.target.value })}
              />
            </div>
            <div>
              <Label>Dias da Semana</Label>
              <div className="mt-2 space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={objectiveFormData.objective_type === 'weekly'}
                    onCheckedChange={(checked) => {
                      setObjectiveFormData(prev => ({
                        ...prev,
                        objective_type: checked ? 'weekly' : 'daily',
                        day_of_week: checked ? null : 0
                      }));
                    }}
                  />
                  <Label className="text-sm font-medium">Semana toda</Label>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {DAYS_OF_WEEK.map(day => (
                    <div key={day.value} className="flex items-center gap-2">
                      <Checkbox
                        checked={objectiveFormData.objective_type === 'weekly' || objectiveFormData.day_of_week === day.value}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setObjectiveFormData(prev => ({
                              ...prev,
                              objective_type: 'daily',
                              day_of_week: day.value
                            }));
                          }
                        }}
                      />
                      <Label className="text-sm">{day.short}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <Label>Meta</Label>
              <Input
                type="number"
                min={1}
                value={objectiveFormData.target_value}
                onChange={(e) => setObjectiveFormData({ ...objectiveFormData, target_value: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div>
              <Label>Cor</Label>
              <div className="flex gap-2 mt-2">
                {COLORS.map(color => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${objectiveFormData.color === color ? 'border-foreground scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setObjectiveFormData({ ...objectiveFormData, color })}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingObjective(null)}>Cancelar</Button>
            <Button onClick={handleUpdateObjective}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Routine Dialog */}
      <Dialog open={isNewRoutineOpen} onOpenChange={setIsNewRoutineOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Rotina</DialogTitle>
            <DialogDescription>Crie uma nova rotina para organizar suas atividades</DialogDescription>
          </DialogHeader>
          <div>
            <Label>Nome da Rotina *</Label>
            <Input
              value={newRoutineName}
              onChange={(e) => setNewRoutineName(e.target.value)}
              placeholder="Ex: Rotina de Treino, Rotina de Estudos..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewRoutineOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateRoutine}>Criar Rotina</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Routine Dialog */}
      <Dialog open={isRenameRoutineOpen} onOpenChange={setIsRenameRoutineOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renomear Rotina</DialogTitle>
          </DialogHeader>
          <div>
            <Label>Novo Nome *</Label>
            <Input
              value={renameRoutineName}
              onChange={(e) => setRenameRoutineName(e.target.value)}
              placeholder="Nome da rotina"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenameRoutineOpen(false)}>Cancelar</Button>
            <Button onClick={handleRenameRoutine}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset All Confirmation */}
      <AlertDialog open={isResetAllOpen} onOpenChange={setIsResetAllOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reiniciar semana?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso irá desmarcar todas as atividades concluídas e resetar o progresso dos objetivos da rotina "{activeRoutine?.name}". As atividades e objetivos serão mantidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Reiniciar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
