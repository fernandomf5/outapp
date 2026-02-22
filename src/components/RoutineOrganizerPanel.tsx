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
  ChevronUp,
  ChevronDown
} from "lucide-react";
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

export default function RoutineOrganizerPanel() {
  const { user } = useAuth();
  const [routineItems, setRoutineItems] = useState<RoutineItem[]>([]);
  const [objectives, setObjectives] = useState<RoutineObjective[]>([]);
  const [completions, setCompletions] = useState<RoutineCompletion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('weekly');
  
  // Dialogs
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);
  const [isAddObjectiveDialogOpen, setIsAddObjectiveDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RoutineItem | null>(null);
  const [editingObjective, setEditingObjective] = useState<RoutineObjective | null>(null);
  
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
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setIsLoading(true);
    
    try {
      const [itemsRes, objectivesRes, completionsRes] = await Promise.all([
        supabase
          .from('routine_items')
          .select('*')
          .eq('user_id', user.id)
          .order('order_index'),
        supabase
          .from('routine_objectives')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at'),
        supabase
          .from('routine_completions')
          .select('*')
          .eq('user_id', user.id)
          .gte('completion_date', format(startOfWeek(new Date(), { weekStartsOn: 0 }), 'yyyy-MM-dd'))
      ]);
      
      if (itemsRes.data) setRoutineItems(itemsRes.data);
      if (objectivesRes.data) setObjectives(objectivesRes.data as RoutineObjective[]);
      if (completionsRes.data) setCompletions(completionsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
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
    const isCompleted = newValue >= objective.target_value;
    
    try {
      const { error } = await supabase
        .from('routine_objectives')
        .update({
          current_value: newValue,
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
    return routineItems.filter(item => item.day_of_week === dayOfWeek).sort((a, b) => a.order_index - b.order_index);
  };

  const handleMoveItem = async (dayOfWeek: number, itemId: string, direction: 'up' | 'down') => {
    const items = getItemsByDay(dayOfWeek);
    const idx = items.findIndex(i => i.id === itemId);
    if (idx < 0) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= items.length) return;

    const itemA = items[idx];
    const itemB = items[swapIdx];

    try {
      await Promise.all([
        supabase.from('routine_items').update({ order_index: itemB.order_index }).eq('id', itemA.id),
        supabase.from('routine_items').update({ order_index: itemA.order_index }).eq('id', itemB.id),
      ]);
      loadData();
    } catch (error) {
      console.error('Error reordering:', error);
      toast.error('Erro ao reordenar atividade');
    }
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            Organizador de Rotina
          </h2>
          <p className="text-muted-foreground">Organize sua semana e acompanhe seus objetivos</p>
        </div>
        <div className="flex gap-2">
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
          
          <Dialog open={isAddObjectiveDialogOpen} onOpenChange={setIsAddObjectiveDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Target className="mr-2 h-4 w-4" />
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
                    placeholder="Ex: Beber 8 copos de água"
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
                  <Label>Meta (quantidade)</Label>
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
                <Button variant="outline" onClick={() => setIsAddObjectiveDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleAddObjective}>Adicionar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
                      <Progress 
                        value={(objective.current_value / objective.target_value) * 100} 
                        className="h-2"
                      />
                      {!objective.is_completed && (
                        <Button
                          size="sm"
                          className="w-full mt-2"
                          onClick={() => handleIncrementObjective(objective)}
                        >
                          <Plus className="mr-1 h-3 w-3" />
                          +1
                        </Button>
                      )}
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
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-wrap break-words">{obj.title}</span>
                              {!obj.is_completed && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5"
                                  onClick={() => handleIncrementObjective(obj)}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              )}
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
                        
                        {/* Routine Items */}
                        {items.map(item => (
                          <div
                            key={item.id}
                            className={`p-2 rounded-md cursor-pointer transition-all ${item.is_completed ? 'opacity-60' : ''}`}
                            style={{ backgroundColor: `${item.color}20`, borderLeft: `3px solid ${item.color}` }}
                          >
                            <div className="flex items-start gap-2">
                              <Checkbox
                                checked={item.is_completed}
                                onCheckedChange={() => handleToggleItemComplete(item)}
                                className="mt-0.5"
                              />
                              <div className="flex-1 min-w-0">
                                <p className={`text-xs font-medium break-words ${item.is_completed ? 'line-through' : ''}`}>
                                  {item.title}
                                </p>
                                {item.start_time && (
                                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-2 w-2" />
                                    {item.start_time}{item.end_time && ` - ${item.end_time}`}
                                  </p>
                                )}
                                <div className="flex gap-1 mt-1">
                                  {item.is_recurring && (
                                    <RefreshCw className="h-2 w-2 text-muted-foreground" />
                                  )}
                                  {item.reminder_minutes && (
                                    <Bell className="h-2 w-2 text-muted-foreground" />
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col gap-0.5">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5"
                                  onClick={() => handleMoveItem(day.value, item.id, 'up')}
                                  disabled={items.indexOf(item) === 0}
                                >
                                  <ChevronUp className="h-2 w-2" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5"
                                  onClick={() => handleMoveItem(day.value, item.id, 'down')}
                                  disabled={items.indexOf(item) === items.length - 1}
                                >
                                  <ChevronDown className="h-2 w-2" />
                                </Button>
                              </div>
                              <div className="flex gap-0.5">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5"
                                  onClick={() => openEditItem(item)}
                                >
                                  <Edit className="h-2 w-2" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 text-destructive"
                                  onClick={() => handleDeleteItem(item.id)}
                                >
                                  <Trash2 className="h-2 w-2" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                        
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
                        <Progress 
                          value={(objective.current_value / objective.target_value) * 100}
                          className="h-2"
                        />
                        {!objective.is_completed ? (
                          <Button
                            size="sm"
                            className="w-full"
                            onClick={() => handleIncrementObjective(objective)}
                          >
                            <Plus className="mr-1 h-4 w-4" />
                            Incrementar
                          </Button>
                        ) : (
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
    </div>
  );
}
