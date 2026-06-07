import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Calendar, Flag, MoreVertical, ChevronLeft, ChevronRight, MoveRight, Users, UserPlus, Building2, ListPlus, Filter, GripVertical } from "lucide-react";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, pointerWithin, closestCenter, PointerSensor, useDroppable, useDraggable, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
interface Task {
  id: string;
  title: string;
  description?: string;
  priority: "low" | "medium" | "high";
  category?: string;
  due_date?: string;
  request_date?: string;
  block_id?: string;
  client_id?: string | null;
  business_id?: string | null;
  task_order?: number;
  created_at: string;
  updated_at: string;
}

interface TaskBlock {
  id: string;
  name: string;
  color: string;
  order_index: number;
  client_id?: string | null;
  business_id?: string | null;
  created_at: string;
  updated_at: string;
}

interface Business {
  id: string;
  name: string;
  logo_url?: string | null;
}

interface TaskCardProps {
  task: Task;
  blocks: TaskBlock[];
  tasksInBlock: Task[];
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onMoveToBlock: (taskId: string, blockId: string) => void;
  onChangeOrder: (taskId: string, order1Based: number) => void;
}

function TaskDescription({ description }: { description: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = description.length > 100;

  return (
    <div className="mb-2">
      <p className={`text-sm text-muted-foreground ${!expanded ? 'line-clamp-2' : ''}`}>
        {description}
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-primary hover:underline mt-1"
        >
          {expanded ? 'Ver menos' : 'Ver mais'}
        </button>
      )}
    </div>
  );
}
function DraggableTaskCard({ task, blocks, tasksInBlock, onEdit, onDelete, onMoveToBlock, onChangeOrder }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { type: 'task', task },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.5 : 1,
  } : undefined;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30";
      case "medium": return "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30";
      case "low": return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "high": return "Alta";
      case "medium": return "Média";
      case "low": return "Baixa";
      default: return priority;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high": return "🔴";
      case "medium": return "🟡";
      case "low": return "🟢";
      default: return "⚪";
    }
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={`mb-3 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 border-l-4 ${
        isDragging ? 'shadow-2xl ring-2 ring-primary/30' : ''
      }`} style={{ borderLeftColor: blocks.find(b => b.id === task.block_id)?.color || 'hsl(var(--border))' }}>
        <CardContent className="p-4">
          <div className="flex items-start gap-2 mb-3">
            <div 
              {...attributes} 
              {...listeners} 
              className="cursor-grab active:cursor-grabbing hover:bg-accent rounded p-1 mt-0.5 transition-colors"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
            <h4 className="font-semibold text-sm flex-1 break-words leading-snug">{task.title}</h4>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0 hover:bg-accent">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onEdit(task)}>
                  <Edit2 className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(task.id)} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Deletar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {task.description && (
            <TaskDescription description={task.description} />
          )}
          
          <div className="flex flex-wrap gap-1.5 items-center mb-3">
            <Badge variant="outline" className={`${getPriorityColor(task.priority)} border text-xs font-medium`}>
              <span className="mr-1">{getPriorityIcon(task.priority)}</span>
              {getPriorityLabel(task.priority)}
            </Badge>
            
            {task.category && (
              <Badge variant="outline" className="bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/30 text-xs">
                {task.category}
              </Badge>
            )}
            
            {task.due_date && (
              <Badge variant="outline" className="bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/30 text-xs">
                <Calendar className="h-3 w-3 mr-1" />
                {task.due_date.split('-').reverse().join('/')}
              </Badge>
            )}

            {task.request_date && (
              <Badge variant="outline" className="bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-500/30 text-xs">
                📋 {task.request_date.split('-').reverse().join('/')}
              </Badge>
            )}
          </div>

          <div className="pt-2 border-t border-border/50 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-xs font-medium text-muted-foreground">Posição</Label>
              <Input
                type="number"
                min={1}
                max={tasksInBlock.length}
                value={(task.task_order ?? 0) + 1}
                onChange={(e) => {
                  const val = parseInt(e.currentTarget.value, 10);
                  if (!Number.isFinite(val)) return;
                  const clamped = Math.max(1, Math.min(tasksInBlock.length, val));
                  onChangeOrder(task.id, clamped);
                }}
                className="h-7 w-16 text-center text-xs font-semibold"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Mover para</Label>
              <div className="flex items-center gap-2">
                <MoveRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <Select 
                  value={task.block_id || ""} 
                  onValueChange={(value) => onMoveToBlock(task.id, value)}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue placeholder="Selecione o bloco" />
                  </SelectTrigger>
                  <SelectContent>
                    {blocks.map((block) => (
                      <SelectItem key={block.id} value={block.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-2.5 h-2.5 rounded-full" 
                            style={{ backgroundColor: block.color }}
                          />
                          <span>{block.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface DroppableBlockProps {
  block: TaskBlock;
  tasks: Task[];
  allBlocks: TaskBlock[];
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onEditBlock: (block: TaskBlock) => void;
  onDeleteBlock: (id: string) => void;
  onMoveTaskToBlock: (taskId: string, blockId: string) => void;
  onChangeOrder: (id: string, order1Based: number) => void;
  onChangeTaskOrder: (taskId: string, order1Based: number) => void;
}

function DroppableBlock({ block, tasks, allBlocks, onEdit, onDelete, onEditBlock, onDeleteBlock, onMoveTaskToBlock, onChangeOrder, onChangeTaskOrder }: DroppableBlockProps) {
  const sortedTasks = [...tasks].sort((a, b) => (a.task_order ?? 0) - (b.task_order ?? 0));
  
  const { isOver, setNodeRef } = useDroppable({
    id: `block-${block.id}`,
    data: { type: 'block', blockId: block.id },
  });

  return (
    <div className="flex-shrink-0 w-80" ref={setNodeRef}>
      <Card className={`h-full flex flex-col transition-all duration-200 ${
        isOver ? 'ring-2 ring-primary/50 shadow-xl scale-[1.01] bg-accent/30' : 'shadow-md'
      }`}>
        <CardHeader className="pb-3 rounded-t-lg" style={{ 
          borderTopColor: block.color, 
          borderTopWidth: '4px',
          background: `linear-gradient(180deg, ${block.color}08 0%, transparent 100%)`
        }}>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div 
                className="w-3.5 h-3.5 rounded-full flex-shrink-0 shadow-sm ring-2 ring-background" 
                style={{ backgroundColor: block.color }}
              />
              <CardTitle className="text-base truncate flex-1" title={block.name}>{block.name}</CardTitle>
              <Badge 
                variant="secondary" 
                className="flex-shrink-0 font-bold text-xs min-w-[28px] justify-center"
                style={{ backgroundColor: `${block.color}20`, color: block.color }}
              >
                {tasks.length}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Label className="text-xs text-muted-foreground">Ordem</Label>
                <Input
                  type="number"
                  min={1}
                  max={allBlocks.length}
                  defaultValue={(block.order_index ?? 0) + 1}
                  onBlur={(e) => {
                    const val = parseInt(e.currentTarget.value, 10);
                    if (!Number.isFinite(val)) return;
                    const clamped = Math.max(1, Math.min(allBlocks.length, val));
                    if (clamped !== (block.order_index ?? 0) + 1) {
                      onChangeOrder(block.id, clamped);
                    }
                    e.currentTarget.value = String(clamped);
                  }}
                  className="h-7 w-14"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover">
                  <DropdownMenuItem onClick={() => onEditBlock(block)}>
                    <Edit2 className="mr-2 h-4 w-4" />
                    Editar Bloco
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDeleteBlock(block.id)} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Deletar Bloco
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-3 min-h-[300px]">
          {sortedTasks.map((task) => (
            <DraggableTaskCard
              key={task.id}
              task={task}
              blocks={allBlocks}
              tasksInBlock={sortedTasks}
              onEdit={onEdit}
              onDelete={onDelete}
              onMoveToBlock={onMoveTaskToBlock}
              onChangeOrder={onChangeTaskOrder}
            />
          ))}
          {sortedTasks.length === 0 && (
            <div className={`text-center py-12 rounded-lg border-2 border-dashed transition-colors ${
              isOver ? 'border-primary/50 bg-primary/5' : 'border-border/50'
            }`}>
              <p className="text-muted-foreground text-sm">
                {isOver ? 'Solte aqui!' : 'Arraste tarefas para cá'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface TeamContext {
  adminUserId: string;
  allowedIds: string[];
}

interface TaskOrganizerPanelProps {
  teamContext?: TeamContext;
}

export const TaskOrganizerPanel = ({ teamContext }: TaskOrganizerPanelProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [blocks, setBlocks] = useState<TaskBlock[]>([]);
  const [clients, setClients] = useState<Array<{id: string, name: string, email?: string, phone?: string, notes?: string, registration_category_id?: string | null}>>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isMultiTaskDialogOpen, setIsMultiTaskDialogOpen] = useState(false);
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);
  const [multiTaskForm, setMultiTaskForm] = useState({
    tasks: "",
    priority: "medium" as "low" | "medium" | "high",
    block_id: "",
    client_id: "",
    business_id: "",
  });
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingBlock, setEditingBlock] = useState<TaskBlock | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [selectedClientFilter, setSelectedClientFilter] = useState<string>("");
  const [selectedBusinessFilter, setSelectedBusinessFilter] = useState<string>("");
  const [filterMode, setFilterMode] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [selectedRegistrationCategoryFilter, setSelectedRegistrationCategoryFilter] = useState<string>("all");
  const [registrationCategories, setRegistrationCategories] = useState<Array<{id: string, name: string}>>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [dateStart, setDateStart] = useState<string>("");
  const [dateEnd, setDateEnd] = useState<string>("");
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high",
    category: "",
    due_date: "",
    request_date: "",
    block_id: "",
    client_id: "",
    business_id: "",
  });

  const [blockForm, setBlockForm] = useState({
    name: "",
    color: "#6366f1",
    client_id: "",
    business_id: "",
  });

  const [taskClientCategories, setTaskClientCategories] = useState<Array<{id:string; name:string}>>([]);

  // Business management state
  const [showBusinessManager, setShowBusinessManager] = useState(false);
  const [isAddBusinessDialogOpen, setIsAddBusinessDialogOpen] = useState(false);
  const [allBusinesses, setAllBusinesses] = useState<Business[]>([]);
  const [businessToRemove, setBusinessToRemove] = useState<string | null>(null);

  // Task client management state
  const [showClientManager, setShowClientManager] = useState(false);
  const [isAddClientDialogOpen, setIsAddClientDialogOpen] = useState(false);
  const [allCustomers, setAllCustomers] = useState<Array<{id: string, name: string, email?: string | null, phone?: string | null, category_id?: string | null}>>([]);
  const [customerCategories, setCustomerCategories] = useState<Array<{id: string, name: string, color: string}>>([]);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");
  const [clientToRemove, setClientToRemove] = useState<string | null>(null);


  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
        tolerance: 5,
      },
    })
  );

  // Custom collision detection with pointerWithin and fallback
  const collisionDetection = (args: any) => {
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) {
      return pointerCollisions;
    }
    return closestCenter(args);
  };

  // Helper to get the correct user ID (admin's ID when team member)
  const getTargetUserId = async (): Promise<string | null> => {
    if (teamContext?.adminUserId) {
      return teamContext.adminUserId;
    }
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  };

  useEffect(() => {
    loadData();
    loadClients();
    loadBusinesses();
    fetchRegistrationCategories();
  }, [teamContext]);

  useEffect(() => {
    if (registrationCategories.length > 0 && filterMode === "all") {
      setFilterMode(registrationCategories[0].id);
    }
  }, [registrationCategories]);

  const fetchRegistrationCategories = async () => {
    const userId = await getTargetUserId();
    if (!userId) return;
    const { data } = await supabase
      .from('registration_categories')
      .select('id, name')
      .eq('user_id', userId)
      .order('name');
    if (data) setRegistrationCategories(data);
  };

  useEffect(() => {
    if (taskForm.client_id) {
      loadClientCategories(taskForm.client_id);
    } else {
      setTaskClientCategories([]);
    }
  }, [taskForm.client_id]);

  const loadClients = async () => {
    try {
      const userId = await getTargetUserId();
      if (!userId) return;

      // Load all contacts from the new registration system
      const { data, error } = await supabase
        .from("contacts")
        .select("id, name, email, phone, registration_category_id")
        .eq("user_id", userId)
        .order("name", { ascending: true });

      if (error) throw error;
      setClients((data || []).map(c => ({
        id: c.id,
        name: c.name,
        email: c.email || undefined,
        phone: c.phone || undefined,
        registration_category_id: c.registration_category_id
      })));
    } catch (error: any) {
      console.error("Erro ao carregar contatos:", error?.message || error);
      setClients([]);
    }
  };

  // Load linked businesses
  const loadBusinesses = async () => {
    try {
      const userId = await getTargetUserId();
      if (!userId) return;

      // Get linked businesses via task_business_links
      const { data: links, error: linksError } = await supabase
        .from("task_business_links")
        .select("business_id")
        .eq("user_id", userId);

      if (linksError) throw linksError;

      if (!links || links.length === 0) {
        setBusinesses([]);
        return;
      }

      const businessIds = links.map(l => l.business_id);

      const { data, error } = await supabase
        .from("businesses")
        .select("id, name, logo_url")
        .in("id", businessIds)
        .order("name", { ascending: true });

      if (error) throw error;
      setBusinesses((data || []) as Business[]);
    } catch (error: any) {
      console.error("Erro ao carregar negócios:", error?.message || error);
      setBusinesses([]);
    }
  };

  // Load all businesses for selection
  const loadAllBusinesses = async () => {
    try {
      const userId = await getTargetUserId();
      if (!userId) return;

      const { data, error } = await supabase
        .from("businesses")
        .select("id, name, logo_url")
        .eq("user_id", userId)
        .order("name", { ascending: true });

      if (error) throw error;
      setAllBusinesses((data || []) as Business[]);
    } catch (error: any) {
      console.error("Erro ao carregar negócios disponíveis:", error?.message || error);
      setAllBusinesses([]);
    }
  };

  // Add business link to task organizer
  const handleLinkBusiness = async (businessId: string) => {
    try {
      const userId = await getTargetUserId();
      if (!userId) return;

      const isLinked = businesses.some(b => b.id === businessId);
      if (isLinked) {
        toast.error("Este negócio já está no organizador de tarefas");
        return;
      }

      const { error } = await supabase
        .from("task_business_links")
        .insert({
          user_id: userId,
          business_id: businessId
        });

      if (error) throw error;
      toast.success("Negócio adicionado ao organizador de tarefas!");
      loadBusinesses();
    } catch (error: any) {
      toast.error("Erro ao adicionar negócio: " + error.message);
    }
  };

  // Remove business link from task organizer
  const handleUnlinkBusiness = async (businessId: string) => {
    try {
      const userId = await getTargetUserId();
      if (!userId) return;

      const { error } = await supabase
        .from("task_business_links")
        .delete()
        .eq("user_id", userId)
        .eq("business_id", businessId);

      if (error) throw error;
      toast.success("Negócio removido do organizador de tarefas!");
      setBusinessToRemove(null);
      loadBusinesses();
    } catch (error: any) {
      toast.error("Erro ao remover negócio: " + error.message);
    }
  };

  // Load all customers for selection
  const loadAllCustomers = async () => {
    try {
      const userId = await getTargetUserId();
      if (!userId) return;

      // Load categories first
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("customer_categories")
        .select("id, name, color")
        .eq("user_id", userId)
        .order("name", { ascending: true });

      if (categoriesError) throw categoriesError;
      setCustomerCategories(categoriesData || []);

      // Load customers with category
      const { data, error } = await supabase
        .from("customers")
        .select("id, name, email, phone, category_id")
        .eq("user_id", userId)
        .order("name", { ascending: true });

      if (error) throw error;
      setAllCustomers(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar clientes disponíveis:", error?.message || error);
      setAllCustomers([]);
      setCustomerCategories([]);
    }
  };

  // Add customer link to task organizer
  const handleLinkCustomer = async (customerId: string) => {
    try {
      const userId = await getTargetUserId();
      if (!userId) return;

      // Check if already linked
      const isLinked = clients.some(c => c.id === customerId);
      if (isLinked) {
        toast.error("Este cliente já está no organizador de tarefas");
        return;
      }

      const { error } = await supabase
        .from("task_client_links")
        .insert({
          user_id: userId,
          customer_id: customerId
        });

      if (error) throw error;
      toast.success("Cliente adicionado ao organizador de tarefas!");
      loadClients();
    } catch (error: any) {
      toast.error("Erro ao adicionar cliente: " + error.message);
    }
  };

  // Remove customer link from task organizer and delete all related tasks
  const handleUnlinkCustomer = async (customerId: string) => {
    try {
      const userId = await getTargetUserId();
      if (!userId) return;

      // First delete all tasks linked to this client
      const { error: tasksError } = await supabase
        .from("tasks")
        .delete()
        .eq("user_id", userId)
        .eq("client_id", customerId);

      if (tasksError) throw tasksError;

      // Then remove the client link
      const { error } = await supabase
        .from("task_client_links")
        .delete()
        .eq("user_id", userId)
        .eq("customer_id", customerId);

      if (error) throw error;
      toast.success("Cliente e suas tarefas removidos do organizador!");
      setClientToRemove(null);
      loadClients();
      loadData();
    } catch (error: any) {
      toast.error("Erro ao remover cliente: " + error.message);
    }
  };

  const loadClientCategories = async (clientId: string) => {
    try {
      const userId = await getTargetUserId();
      if (!userId) return;

      const { data, error } = await supabase
        .from("task_categories")
        .select("id, name")
        .eq("user_id", userId)
        .eq("client_id", clientId)
        .order("name", { ascending: true });

      if (error) throw error;
      setTaskClientCategories(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar categorias:", error?.message || error);
      setTaskClientCategories([]);
    }
  };

  const handleAddCategoryPrompt = async () => {
    const categoryName = prompt("Digite o nome da nova categoria para este cliente:");
    if (!categoryName || !categoryName.trim()) return;

    try {
      const userId = await getTargetUserId();
      if (!userId) return;

      const { error } = await supabase
        .from("task_categories")
        .insert({
          user_id: userId,
          client_id: taskForm.client_id,
          name: categoryName.trim()
        });

      if (error) throw error;

      toast.success("Categoria criada com sucesso!");
      await loadClientCategories(taskForm.client_id);
    } catch (error: any) {
      toast.error("Erro ao criar categoria: " + error.message);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const userId = await getTargetUserId();
      if (!userId) return;

      // Load blocks - filter by allowed client IDs if team member
      let blocksQuery = supabase
        .from("task_blocks")
        .select("*")
        .eq("user_id", userId)
        .order("order_index", { ascending: true });

      // If team member with restrictions, filter blocks by client_id
      if (teamContext?.allowedIds && teamContext.allowedIds.length > 0) {
        blocksQuery = blocksQuery.or(`client_id.in.(${teamContext.allowedIds.join(',')}),client_id.is.null`);
      }

      const { data: blocksData, error: blocksError } = await blocksQuery;

      if (blocksError) throw blocksError;

      // If no blocks exist and not a team member, create default ones
      if ((!blocksData || blocksData.length === 0) && !teamContext) {
        await createDefaultBlocks(userId);
        await loadData();
        return;
      }

      setBlocks(blocksData || []);

      // Load tasks - filter by allowed client IDs if team member
      let tasksQuery = supabase
        .from("tasks")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      // If team member with restrictions, filter tasks by client_id
      if (teamContext?.allowedIds && teamContext.allowedIds.length > 0) {
        tasksQuery = tasksQuery.in("client_id", teamContext.allowedIds);
      }

      const { data: tasksData, error: tasksError } = await tasksQuery;

      if (tasksError) throw tasksError;
      setTasks((tasksData || []) as Task[]);
    } catch (error: any) {
      toast.error("Erro ao carregar dados: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultBlocks = async (userId: string) => {
    const defaultBlocks = [
      { name: "A Fazer", color: "#ef4444", order_index: 0 },
      { name: "Em Andamento", color: "#f59e0b", order_index: 1 },
      { name: "Concluído", color: "#10b981", order_index: 2 },
    ];

    for (const block of defaultBlocks) {
      await supabase.from("task_blocks").insert({
        user_id: userId,
        ...block,
      });
    }
  };

  const handleAddTask = async () => {
    try {
      if (!taskForm.title.trim()) {
        toast.error("Por favor, preencha o título da tarefa");
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (editingTask) {
        const updatePayload: any = {
          title: taskForm.title,
          description: taskForm.description,
          priority: taskForm.priority,
          category: taskForm.category,
          due_date: taskForm.due_date || null,
          request_date: taskForm.request_date || null,
          block_id: taskForm.block_id || null,
          client_id: taskForm.client_id || null,
          business_id: taskForm.business_id || null,
        };

        const { error } = await supabase
          .from("tasks")
          .update(updatePayload as any)
          .eq("id", editingTask.id);

        if (error) throw error;
        toast.success("Tarefa atualizada com sucesso!");
      } else {
        const insertPayload: any = {
          user_id: user.id,
          title: taskForm.title,
          description: taskForm.description,
          priority: taskForm.priority,
          category: taskForm.category,
          due_date: taskForm.due_date || null,
          request_date: taskForm.request_date || null,
          block_id: taskForm.block_id || blocks[0]?.id || null,
          client_id: taskForm.client_id || null,
          business_id: taskForm.business_id || null,
        };

        const { error } = await supabase.from("tasks").insert(insertPayload as any);

        if (error) throw error;
        toast.success("Tarefa criada com sucesso!");
      }

      setIsTaskDialogOpen(false);
      setEditingTask(null);
      setTaskForm({
        title: "",
        description: "",
        priority: "medium",
        category: "",
        due_date: "",
        request_date: "",
        block_id: "",
        client_id: "",
        business_id: "",
      });
      loadData();
    } catch (error: any) {
      toast.error("Erro ao salvar tarefa: " + error.message);
    }
  };

  const handleAddMultipleTasks = async () => {
    try {
      const taskLines = multiTaskForm.tasks.split('\n').filter(line => line.trim());
      
      if (taskLines.length === 0) {
        toast.error("Por favor, digite pelo menos uma tarefa");
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const tasksToInsert = taskLines.map(title => ({
        user_id: user.id,
        title: title.trim(),
        description: "",
        priority: multiTaskForm.priority,
        category: "",
        due_date: null,
        request_date: null,
        block_id: multiTaskForm.block_id || blocks[0]?.id || null,
        client_id: multiTaskForm.client_id || null,
        business_id: multiTaskForm.business_id || null,
      }));

      const { error } = await supabase.from("tasks").insert(tasksToInsert as any);

      if (error) throw error;
      toast.success(`${taskLines.length} tarefa(s) criada(s) com sucesso!`);

      setIsMultiTaskDialogOpen(false);
      setMultiTaskForm({
        tasks: "",
        priority: "medium",
        block_id: "",
        client_id: "",
        business_id: "",
      });
      loadData();
    } catch (error: any) {
      toast.error("Erro ao criar tarefas: " + error.message);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
      toast.success("Tarefa deletada com sucesso!");
      loadData();
    } catch (error: any) {
      toast.error("Erro ao deletar tarefa: " + error.message);
    }
  };

  const handleAddBlock = async () => {
    try {
      if (!blockForm.name.trim()) {
        toast.error("Por favor, preencha o nome do bloco");
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (editingBlock) {
        const { error } = await supabase
          .from("task_blocks")
          .update({
            name: blockForm.name,
            color: blockForm.color,
            client_id: blockForm.client_id || null,
            business_id: blockForm.business_id || null,
          })
          .eq("id", editingBlock.id);

        if (error) throw error;
        toast.success("Bloco atualizado com sucesso!");
      } else {
        const { error } = await supabase.from("task_blocks").insert({
          user_id: user.id,
          name: blockForm.name,
          color: blockForm.color,
          client_id: blockForm.client_id || null,
          business_id: blockForm.business_id || null,
          order_index: blocks.length,
        });

        if (error) throw error;
        toast.success("Bloco criado com sucesso!");
      }

      setIsBlockDialogOpen(false);
      setEditingBlock(null);
      setBlockForm({ name: "", color: "#6366f1", client_id: "", business_id: "" });
      loadData();
    } catch (error: any) {
      toast.error("Erro ao salvar bloco: " + error.message);
    }
  };

  const handleDeleteBlock = async (id: string) => {
    try {
      const tasksInBlock = tasks.filter(t => t.block_id === id);
      if (tasksInBlock.length > 0) {
        toast.error("Não é possível deletar um bloco que contém tarefas. Mova ou delete as tarefas primeiro.");
        return;
      }

      const { error } = await supabase.from("task_blocks").delete().eq("id", id);
      if (error) throw error;
      toast.success("Bloco deletado com sucesso!");
      loadData();
    } catch (error: any) {
      toast.error("Erro ao deletar bloco: " + error.message);
    }
  };

  const handleMoveBlockForward = async (id: string) => {
    try {
      const currentBlockIndex = blocks.findIndex(b => b.id === id);
      if (currentBlockIndex >= blocks.length - 1) return; // Já está no final
      
      const currentBlock = blocks[currentBlockIndex];
      const nextBlock = blocks[currentBlockIndex + 1];

      // Trocar order_index entre os blocos (ir para a direita)
      const newBlocks = [...blocks];
      newBlocks[currentBlockIndex] = { ...currentBlock, order_index: nextBlock.order_index };
      newBlocks[currentBlockIndex + 1] = { ...nextBlock, order_index: currentBlock.order_index };
      newBlocks.sort((a, b) => a.order_index - b.order_index);
      
      setBlocks(newBlocks);

      // Atualizar no banco
      await Promise.all([
        supabase.from("task_blocks").update({ order_index: currentBlock.order_index }).eq("id", nextBlock.id),
        supabase.from("task_blocks").update({ order_index: nextBlock.order_index }).eq("id", currentBlock.id)
      ]);

      toast.success("Bloco movido para frente!");
    } catch (error: any) {
      toast.error("Erro ao mover bloco: " + error.message);
      loadData();
    }
  };

  const handleMoveBlockBackward = async (id: string) => {
    try {
      const currentBlockIndex = blocks.findIndex(b => b.id === id);
      if (currentBlockIndex <= 0) return; // Já está no início
      
      const currentBlock = blocks[currentBlockIndex];
      const previousBlock = blocks[currentBlockIndex - 1];

      // Trocar order_index entre os blocos (ir para a esquerda)
      const newBlocks = [...blocks];
      newBlocks[currentBlockIndex] = { ...currentBlock, order_index: previousBlock.order_index };
      newBlocks[currentBlockIndex - 1] = { ...previousBlock, order_index: currentBlock.order_index };
      newBlocks.sort((a, b) => a.order_index - b.order_index);
      
      setBlocks(newBlocks);

      // Atualizar no banco
      await Promise.all([
        supabase.from("task_blocks").update({ order_index: currentBlock.order_index }).eq("id", previousBlock.id),
        supabase.from("task_blocks").update({ order_index: previousBlock.order_index }).eq("id", currentBlock.id)
      ]);

      toast.success("Bloco movido para trás!");
    } catch (error: any) {
      toast.error("Erro ao mover bloco: " + error.message);
      loadData();
    }
  };

  const handleMoveTaskToBlock = async (taskId: string, blockId: string) => {
    try {
      // Ao mover para outro bloco, reseta a ordem para 0
      setTasks(prevTasks => 
        prevTasks.map(t => 
          t.id === taskId ? { ...t, block_id: blockId, task_order: 0 } : t
        )
      );

      // Atualizar no banco em background
      const { error } = await supabase
        .from("tasks")
        .update({ block_id: blockId, task_order: 0 })
        .eq("id", taskId);

      if (error) throw error;
      toast.success("Tarefa movida com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao mover tarefa: " + error.message);
      loadData(); // Recarrega em caso de erro
    }
  };

  const handleChangeTaskOrder = async (taskId: string, order1Based: number) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task || !task.block_id) return;

      const tasksInBlock = tasks.filter(t => t.block_id === task.block_id);
      const total = tasksInBlock.length;
      const target = Math.max(1, Math.min(total, Math.floor(order1Based || 1))) - 1;
      
      const currentIndex = tasksInBlock.findIndex(t => t.id === taskId);
      if (currentIndex === -1) return;

      const current = tasksInBlock[currentIndex];
      const others = tasksInBlock
        .filter(t => t.id !== taskId)
        .sort((a, b) => (a.task_order ?? 0) - (b.task_order ?? 0));
      
      const reordered = [...others];
      reordered.splice(target, 0, current);
      const newTasksInBlock = reordered.map((t, i) => ({ ...t, task_order: i }));

      // Atualiza localmente
      setTasks(prevTasks => 
        prevTasks.map(t => {
          const updated = newTasksInBlock.find(nt => nt.id === t.id);
          return updated || t;
        })
      );

      // Atualizar no banco
      await Promise.all(
        newTasksInBlock.map(t =>
          supabase.from('tasks').update({ task_order: t.task_order }).eq('id', t.id)
        )
      );

      toast.success('Ordem da tarefa atualizada!');
    } catch (error: any) {
      toast.error('Erro ao atualizar ordem: ' + error.message);
      loadData();
    }
  };

  const handleChangeBlockOrder = async (blockId: string, order1Based: number) => {
    try {
      const total = blocks.length;
      const target = Math.max(1, Math.min(total, Math.floor(order1Based || 1))) - 1;
      const currentIndex = blocks.findIndex(b => b.id === blockId);
      if (currentIndex === -1) return;
      const current = blocks[currentIndex];
      const others = blocks
        .filter(b => b.id !== blockId)
        .sort((a, b) => a.order_index - b.order_index);
      const reordered = [...others];
      reordered.splice(target, 0, current);
      const newBlocks = reordered.map((b, i) => ({ ...b, order_index: i }));
      setBlocks(newBlocks);
      await Promise.all(
        newBlocks.map(b =>
          supabase.from('task_blocks').update({ order_index: b.order_index }).eq('id', b.id)
        )
      );
      toast.success('Ordem do bloco atualizada!');
    } catch (error: any) {
      toast.error('Erro ao atualizar ordem: ' + error.message);
      loadData();
    }
  };

  const openEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      category: task.category || "",
      due_date: task.due_date || "",
      request_date: task.request_date || "",
      block_id: task.block_id || "",
      client_id: task.client_id || "",
      business_id: task.business_id || "",
    });
    setIsTaskDialogOpen(true);
  };

  const openEditBlock = (block: TaskBlock) => {
    setEditingBlock(block);
    setBlockForm({
      name: block.name,
      color: block.color,
      client_id: block.client_id || "",
      business_id: block.business_id || "",
    });
    setIsBlockDialogOpen(true);
  };

  // Analytics data
  const analyticsData = blocks.map(block => ({
    name: block.name,
    count: tasks.filter(t => t.block_id === block.id).length,
    color: block.color,
  }));

  const priorityData = [
    { name: "Alta", count: tasks.filter(t => t.priority === "high").length, color: "#ef4444" },
    { name: "Média", count: tasks.filter(t => t.priority === "medium").length, color: "#f59e0b" },
    { name: "Baixa", count: tasks.filter(t => t.priority === "low").length, color: "#10b981" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Filter tasks and blocks based on filter mode (registration categories)
  const filteredTasksBase = tasks.filter(task => {
    if (filterMode === "all") return true;
    
    // Find the contact associated with this task to check its category
    const contact = clients.find(c => c.id === task.client_id);
    return contact?.registration_category_id === filterMode;
  });

  const filteredByPriority = priorityFilter === 'all' 
    ? filteredTasksBase 
    : filteredTasksBase.filter(t => t.priority === priorityFilter as any);

  const filteredByDate = filteredByPriority.filter(t => {
    if (!dateStart && !dateEnd) return true;
    const d = t.due_date ? new Date(t.due_date) : null;
    if (!d) return false;
    const startOk = dateStart ? d >= new Date(dateStart) : true;
    const endOk = dateEnd ? d <= new Date(dateEnd) : true;
    return startOk && endOk;
  });

  const filteredTasks = filteredByDate;

  const filteredBlocks = blocks.filter(block => {
    if (filterMode === "all") return true;
    
    // Find the contact associated with this block to check its category
    const contact = clients.find(c => c.id === block.client_id);
    return contact?.registration_category_id === filterMode || (!block.client_id && !block.business_id);
  });

  const tasksByBlock = filteredTasks.reduce((acc, task) => {
    if (!acc[task.block_id || '']) {
      acc[task.block_id || ''] = [];
    }
    acc[task.block_id || ''].push(task);
    return acc;
  }, {} as Record<string, typeof tasks>);

  // Check if this is a team member context
  const isTeamMember = !!teamContext?.allowedIds && teamContext.allowedIds.length > 0;

  // Show selection screen if no filter selected or manager is open
  const showSelectionScreen = filterMode !== "all" && !registrationCategories.find(c => c.id === filterMode);

  if (showSelectionScreen) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-2">Organizador de Tarefas</h2>
          <p className="text-muted-foreground mb-4">
            Organize suas tarefas pelas categorias de cadastro
          </p>
          
          {/* Mode Toggle with Registration Categories */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            <Button 
              variant={filterMode === "all" ? "default" : "outline"}
              onClick={() => {
                setFilterMode("all");
              }}
              className="gap-2"
            >
              <ListPlus className="h-4 w-4" />
              Todas as Categorias
            </Button>
            
            {registrationCategories.map(category => (
              <Button 
                key={category.id}
                variant={filterMode === category.id ? "default" : "outline"}
                onClick={() => {
                  setFilterMode(category.id);
                  setSelectedClientFilter("");
                  setSelectedBusinessFilter("");
                }}
                className="gap-2"
              >
                <Users className="h-4 w-4" />
                {category.name}
              </Button>
            ))}
          </div>
        </div>
        
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  {filterMode === "client" ? (
                    <>
                      <CardTitle>{showClientManager ? "Gerenciar Clientes" : "Selecione o Cliente"}</CardTitle>
                      <CardDescription>
                        {showClientManager 
                          ? "Adicione ou remova clientes do organizador de tarefas"
                          : "Escolha um cliente para gerenciar suas tarefas"
                        }
                      </CardDescription>
                    </>
                  ) : (
                    <>
                      <CardTitle>{showBusinessManager ? "Gerenciar Negócios" : "Selecione o Negócio"}</CardTitle>
                      <CardDescription>
                        {showBusinessManager 
                          ? "Adicione ou remova negócios do organizador de tarefas"
                          : "Escolha um negócio para gerenciar suas tarefas"
                        }
                      </CardDescription>
                    </>
                  )}
                </div>
                {!isTeamMember && (
                  <div className="flex gap-2">
                    {filterMode === "client" ? (
                      showClientManager ? (
                        <Button variant="outline" onClick={() => setShowClientManager(false)}>
                          <ChevronLeft className="mr-2 h-4 w-4" />
                          Voltar
                        </Button>
                      ) : (
                        <Button variant="outline" onClick={() => setShowClientManager(true)}>
                          <Users className="mr-2 h-4 w-4" />
                          Gerenciar Clientes
                        </Button>
                      )
                    ) : (
                      showBusinessManager ? (
                        <Button variant="outline" onClick={() => setShowBusinessManager(false)}>
                          <ChevronLeft className="mr-2 h-4 w-4" />
                          Voltar
                        </Button>
                      ) : (
                        <Button variant="outline" onClick={() => setShowBusinessManager(true)}>
                          <Building2 className="mr-2 h-4 w-4" />
                          Gerenciar Negócios
                        </Button>
                      )
                    )}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {filterMode === "client" ? (
                showClientManager ? (
                  <>
                    <Button 
                      className="w-full" 
                      onClick={() => {
                        loadAllCustomers();
                        setIsAddClientDialogOpen(true);
                      }}
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Adicionar Cliente da Gestão
                    </Button>
                    
                    <div className="grid gap-3 mt-4">
                      {clients.map(client => (
                        <Card key={client.id} className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold">{client.name}</h4>
                              {client.email && (
                                <p className="text-sm text-muted-foreground">{client.email}</p>
                              )}
                              <p className="text-xs text-muted-foreground mt-1">
                                {tasks.filter(t => t.client_id === client.id).length} tarefas vinculadas
                              </p>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setClientToRemove(client.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </Card>
                      ))}
                      {clients.length === 0 && (
                        <p className="text-center text-muted-foreground py-4">
                          Nenhum cliente adicionado. Clique em "Adicionar Cliente da Gestão" para selecionar.
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="grid gap-3">
                    {!isTeamMember && (
                      <>
                        <Button 
                          variant="outline" 
                          className="justify-start h-auto py-4 px-4"
                          onClick={() => setSelectedClientFilter("all")}
                        >
                          <div className="text-left">
                            <div className="font-semibold">Todos os Clientes</div>
                            <div className="text-sm text-muted-foreground">Ver tarefas de todos os clientes</div>
                          </div>
                        </Button>
                        <Button 
                          variant="outline" 
                          className="justify-start h-auto py-4 px-4"
                          onClick={() => setSelectedClientFilter("none")}
                        >
                          <div className="text-left">
                            <div className="font-semibold">Sem Cliente</div>
                            <div className="text-sm text-muted-foreground">Tarefas não vinculadas</div>
                          </div>
                        </Button>
                      </>
                    )}
                    {clients.map(client => (
                      <div key={client.id} className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          className="justify-start h-auto py-4 px-4 flex-1"
                          onClick={() => setSelectedClientFilter(client.id)}
                        >
                          <div className="text-left">
                            <div className="font-semibold">{client.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {tasks.filter(t => t.client_id === client.id).length} tarefas
                            </div>
                          </div>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="text-destructive hover:text-destructive shrink-0"
                          onClick={() => setClientToRemove(client.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {clients.length === 0 && !isTeamMember && (
                      <div className="text-center py-4">
                        <p className="text-muted-foreground mb-4">
                          Nenhum cliente cadastrado no organizador de tarefas.
                        </p>
                        <Button onClick={() => {
                          loadAllCustomers();
                          setIsAddClientDialogOpen(true);
                        }}>
                          <UserPlus className="mr-2 h-4 w-4" />
                          Adicionar Cliente
                        </Button>
                      </div>
                    )}
                  </div>
                )
              ) : (
                showBusinessManager ? (
                  <>
                    <Button 
                      className="w-full" 
                      onClick={() => {
                        loadAllBusinesses();
                        setIsAddBusinessDialogOpen(true);
                      }}
                    >
                      <Building2 className="mr-2 h-4 w-4" />
                      Adicionar Negócio da Gestão
                    </Button>
                    
                    <div className="grid gap-3 mt-4">
                      {businesses.map(business => (
                        <Card key={business.id} className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              {business.logo_url ? (
                                <img src={business.logo_url} alt={business.name} className="w-10 h-10 rounded-lg object-cover" />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                                  <Building2 className="h-5 w-5 text-muted-foreground" />
                                </div>
                              )}
                              <div>
                                <h4 className="font-semibold">{business.name}</h4>
                                <p className="text-xs text-muted-foreground">
                                  {tasks.filter(t => t.business_id === business.id).length} tarefas vinculadas
                                </p>
                              </div>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setBusinessToRemove(business.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </Card>
                      ))}
                      {businesses.length === 0 && (
                        <p className="text-center text-muted-foreground py-4">
                          Nenhum negócio adicionado. Clique em "Adicionar Negócio da Gestão" para selecionar.
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="grid gap-3">
                    {!isTeamMember && (
                      <>
                        <Button 
                          variant="outline" 
                          className="justify-start h-auto py-4 px-4"
                          onClick={() => setSelectedBusinessFilter("all")}
                        >
                          <div className="text-left">
                            <div className="font-semibold">Todos os Negócios</div>
                            <div className="text-sm text-muted-foreground">Ver tarefas de todos os negócios</div>
                          </div>
                        </Button>
                        <Button 
                          variant="outline" 
                          className="justify-start h-auto py-4 px-4"
                          onClick={() => setSelectedBusinessFilter("none")}
                        >
                          <div className="text-left">
                            <div className="font-semibold">Sem Negócio</div>
                            <div className="text-sm text-muted-foreground">Tarefas não vinculadas</div>
                          </div>
                        </Button>
                      </>
                    )}
                    {businesses.map(business => (
                      <div key={business.id} className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          className="justify-start h-auto py-4 px-4 gap-3 flex-1"
                          onClick={() => setSelectedBusinessFilter(business.id)}
                        >
                          {business.logo_url ? (
                            <img src={business.logo_url} alt={business.name} className="w-8 h-8 rounded-lg object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                          <div className="text-left">
                            <div className="font-semibold">{business.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {tasks.filter(t => t.business_id === business.id).length} tarefas
                            </div>
                          </div>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="text-destructive hover:text-destructive shrink-0"
                          onClick={() => setBusinessToRemove(business.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {businesses.length === 0 && !isTeamMember && (
                      <div className="text-center py-4">
                        <p className="text-muted-foreground mb-4">
                          Nenhum negócio cadastrado no organizador de tarefas.
                        </p>
                        <Button onClick={() => {
                          loadAllBusinesses();
                          setIsAddBusinessDialogOpen(true);
                        }}>
                          <Building2 className="mr-2 h-4 w-4" />
                          Adicionar Negócio
                        </Button>
                      </div>
                    )}
                  </div>
                )
              )}
            </CardContent>
          </Card>
        </div>

        {/* Add Client from Customers Dialog */}
        <Dialog open={isAddClientDialogOpen} onOpenChange={(open) => {
          setIsAddClientDialogOpen(open);
          if (!open) setSelectedCategoryFilter("all");
        }}>
          <DialogContent className="max-h-[80vh] overflow-y-auto max-w-2xl">
            <DialogHeader>
              <DialogTitle>Selecionar Cliente</DialogTitle>
              <DialogDescription>
                Escolha um cliente da gestão de clientes para adicionar ao organizador de tarefas
              </DialogDescription>
            </DialogHeader>
            
            {/* Category filter */}
            {customerCategories.length > 0 && (
              <div className="flex flex-wrap gap-2 pb-2 border-b">
                <Button
                  variant={selectedCategoryFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategoryFilter("all")}
                >
                  Todos
                </Button>
                <Button
                  variant={selectedCategoryFilter === "none" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategoryFilter("none")}
                >
                  Sem Categoria
                </Button>
                {customerCategories.map(cat => (
                  <Button
                    key={cat.id}
                    variant={selectedCategoryFilter === cat.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategoryFilter(cat.id)}
                    className="gap-2"
                  >
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: cat.color }}
                    />
                    {cat.name}
                  </Button>
                ))}
              </div>
            )}

            <div className="space-y-3 max-h-[50vh] overflow-y-auto">
              {(() => {
                const availableCustomers = allCustomers.filter(c => !clients.some(linked => linked.id === c.id));
                const filteredCustomers = selectedCategoryFilter === "all" 
                  ? availableCustomers
                  : selectedCategoryFilter === "none"
                    ? availableCustomers.filter(c => !c.category_id)
                    : availableCustomers.filter(c => c.category_id === selectedCategoryFilter);
                
                if (filteredCustomers.length === 0) {
                  return (
                    <p className="text-center text-muted-foreground py-4">
                      {availableCustomers.length === 0 
                        ? allCustomers.length === 0 
                          ? "Nenhum cliente cadastrado na gestão de clientes." 
                          : "Todos os clientes já foram adicionados ao organizador."
                        : "Nenhum cliente encontrado nesta categoria."
                      }
                    </p>
                  );
                }

                return filteredCustomers.map(customer => {
                  const category = customerCategories.find(c => c.id === customer.category_id);
                  return (
                    <Card 
                      key={customer.id} 
                      className="p-4 cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => {
                        handleLinkCustomer(customer.id);
                        setIsAddClientDialogOpen(false);
                        setSelectedCategoryFilter("all");
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{customer.name}</h4>
                            {category && (
                              <Badge 
                                variant="secondary" 
                                className="text-xs"
                                style={{ 
                                  backgroundColor: `${category.color}20`, 
                                  color: category.color,
                                  borderColor: category.color 
                                }}
                              >
                                {category.name}
                              </Badge>
                            )}
                          </div>
                          {customer.email && (
                            <p className="text-sm text-muted-foreground">{customer.email}</p>
                          )}
                        </div>
                        <Plus className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </Card>
                  );
                });
              })()}
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Business Dialog */}
        <Dialog open={isAddBusinessDialogOpen} onOpenChange={setIsAddBusinessDialogOpen}>
          <DialogContent className="max-h-[80vh] overflow-y-auto max-w-2xl">
            <DialogHeader>
              <DialogTitle>Selecionar Negócio</DialogTitle>
              <DialogDescription>
                Escolha um negócio da gestão de negócios para adicionar ao organizador de tarefas
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-3 max-h-[50vh] overflow-y-auto">
              {(() => {
                const availableBusinesses = allBusinesses.filter(b => !businesses.some(linked => linked.id === b.id));
                
                if (availableBusinesses.length === 0) {
                  return (
                    <p className="text-center text-muted-foreground py-4">
                      {allBusinesses.length === 0 
                        ? "Nenhum negócio cadastrado na gestão de negócios." 
                        : "Todos os negócios já foram adicionados ao organizador."
                      }
                    </p>
                  );
                }

                return availableBusinesses.map(business => (
                  <Card 
                    key={business.id} 
                    className="p-4 cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => {
                      handleLinkBusiness(business.id);
                      setIsAddBusinessDialogOpen(false);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        {business.logo_url ? (
                          <img src={business.logo_url} alt={business.name} className="w-10 h-10 rounded-lg object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <h4 className="font-semibold">{business.name}</h4>
                      </div>
                      <Plus className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </Card>
                ));
              })()}
            </div>
          </DialogContent>
        </Dialog>

        {/* Remove Client Confirmation */}
        <AlertDialog open={!!clientToRemove} onOpenChange={(open) => !open && setClientToRemove(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remover cliente do organizador?</AlertDialogTitle>
              <AlertDialogDescription>
                Isso irá remover o cliente do organizador de tarefas. O cliente continuará existindo na gestão de clientes e as tarefas vinculadas não serão excluídas.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => clientToRemove && handleUnlinkCustomer(clientToRemove)}
              >
                Remover
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Remove Business Confirmation */}
        <AlertDialog open={!!businessToRemove} onOpenChange={(open) => !open && setBusinessToRemove(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remover negócio do organizador?</AlertDialogTitle>
              <AlertDialogDescription>
                Isso irá remover o negócio do organizador de tarefas. O negócio continuará existindo na gestão de negócios e as tarefas vinculadas não serão excluídas.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => businessToRemove && handleUnlinkBusiness(businessToRemove)}
              >
                Remover
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold">Organizador de Tarefas</h2>
          <p className="text-muted-foreground">Organize suas tarefas com drag-and-drop</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {/* Mode Toggle with Registration Categories */}
          <div className="flex border rounded-md overflow-x-auto max-w-[400px] no-scrollbar">
            {registrationCategories.map((cat) => (
              <Button 
                key={cat.id}
                variant={filterMode === cat.id ? "default" : "ghost"}
                size="sm"
                onClick={() => {
                  setFilterMode(cat.id);
                  setSelectedClientFilter("");
                  setSelectedBusinessFilter("");
                }}
                className="rounded-none border-r last:border-r-0 whitespace-nowrap"
              >
                {cat.name}
              </Button>
            ))}
          </div>

          <Select 
            value={selectedClientFilter} 
            onValueChange={setSelectedClientFilter}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Selecionar cadastro" />
            </SelectTrigger>
            <SelectContent>
              {!isTeamMember && (
                <>
                  <SelectItem value="all">Ver Todos</SelectItem>
                  <SelectItem value="none">Sem Vínculo</SelectItem>
                </>
              )}
              {(() => {
                // Filter items from contacts table based on current category
                return clients
                  .filter(c => (c as any).registration_category_id === filterMode)
                  .map(item => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ));
              })()}
            </SelectContent>
          </Select>
          <Button 
            variant={showFilters ? "default" : "outline"} 
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            Filtros
            {(priorityFilter !== 'all' || dateStart || dateEnd) && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {(priorityFilter !== 'all' ? 1 : 0) + (dateStart || dateEnd ? 1 : 0)}
              </Badge>
            )}
          </Button>
          {showFilters && (
            <div className="flex flex-wrap items-center gap-2">
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas Prioridades</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="low">Baixa</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Label className="text-sm whitespace-nowrap">Vencimento:</Label>
                <Input 
                  type="date" 
                  value={dateStart} 
                  onChange={(e) => setDateStart(e.target.value)} 
                  placeholder="De"
                  className="w-[150px]" 
                />
                <span className="text-muted-foreground">até</span>
                <Input 
                  type="date" 
                  value={dateEnd} 
                  onChange={(e) => setDateEnd(e.target.value)} 
                  placeholder="Até"
                  className="w-[150px]" 
                />
              </div>
            </div>
          )}
          <Dialog open={isBlockDialogOpen} onOpenChange={setIsBlockDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={() => {
                setEditingBlock(null);
                setBlockForm({ 
                  name: "", 
                  color: "#6366f1", 
                  client_id: filterMode === "client" && selectedClientFilter !== "all" ? selectedClientFilter : "", 
                  business_id: filterMode === "business" && selectedBusinessFilter !== "all" ? selectedBusinessFilter : "" 
                });
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Bloco
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingBlock ? "Editar Bloco" : "Novo Bloco"}</DialogTitle>
                <DialogDescription>
                  {editingBlock ? "Edite as informações do bloco" : "Crie um novo bloco para organizar suas tarefas"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="blockName">Nome do Bloco</Label>
                  <Input
                    id="blockName"
                    value={blockForm.name}
                    onChange={(e) => setBlockForm({ ...blockForm, name: e.target.value })}
                    placeholder="Ex: Em Revisão"
                  />
                </div>
                <div>
                  <Label htmlFor="blockClient">Cliente</Label>
                  <Select value={blockForm.client_id || "__none__"} onValueChange={(value) => setBlockForm({ ...blockForm, client_id: value === "__none__" ? "" : value })}>
                    <SelectTrigger id="blockClient">
                      <SelectValue placeholder="Selecione um cliente (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Sem Cliente</SelectItem>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="blockBusiness">Negócio</Label>
                  <Select value={blockForm.business_id || "__none__"} onValueChange={(value) => setBlockForm({ ...blockForm, business_id: value === "__none__" ? "" : value })}>
                    <SelectTrigger id="blockBusiness">
                      <SelectValue placeholder="Selecione um negócio (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Sem Negócio</SelectItem>
                      {businesses.map(business => (
                        <SelectItem key={business.id} value={business.id}>
                          {business.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="blockColor">Cor</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="blockColor"
                      type="color"
                      value={blockForm.color}
                      onChange={(e) => setBlockForm({ ...blockForm, color: e.target.value })}
                      className="w-20 h-10"
                    />
                    <span className="text-sm text-muted-foreground">{blockForm.color}</span>
                  </div>
                </div>
                <Button onClick={handleAddBlock} className="w-full">
                  {editingBlock ? "Atualizar Bloco" : "Criar Bloco"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>


          <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingTask(null);
                setTaskForm({
                  title: "",
                  description: "",
                  priority: "medium",
                  category: "",
                  due_date: "",
                  request_date: "",
                  block_id: "",
                  client_id: "",
                  business_id: "",
                });
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Tarefa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingTask ? "Editar Tarefa" : "Nova Tarefa"}</DialogTitle>
                <DialogDescription>
                  {editingTask ? "Edite as informações da tarefa" : "Adicione uma nova tarefa ao seu organizador"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={taskForm.title}
                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                    placeholder="Nome da tarefa"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={taskForm.description}
                    onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                    placeholder="Detalhes da tarefa"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="priority">Prioridade</Label>
                    <Select value={taskForm.priority} onValueChange={(value: any) => setTaskForm({ ...taskForm, priority: value })}>
                      <SelectTrigger id="priority">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="block">Bloco</Label>
                    <Select value={taskForm.block_id} onValueChange={(value) => setTaskForm({ ...taskForm, block_id: value })}>
                      <SelectTrigger id="block">
                        <SelectValue placeholder="Selecione um bloco" />
                      </SelectTrigger>
                      <SelectContent>
                        {blocks.map(block => (
                          <SelectItem key={block.id} value={block.id}>
                            {block.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Categoria</Label>
                    <Input
                      id="category"
                      value={taskForm.category}
                      onChange={(e) => setTaskForm({ ...taskForm, category: e.target.value })}
                      placeholder="Ex: Trabalho"
                    />
                  </div>
                  <div>
                    <Label htmlFor="due_date">Data de Vencimento</Label>
                    <Input
                      id="due_date"
                      type="date"
                      value={taskForm.due_date}
                      onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="request_date">Data da Solicitação</Label>
                    <Input
                      id="request_date"
                      type="date"
                      value={taskForm.request_date}
                      onChange={(e) => setTaskForm({ ...taskForm, request_date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="client">Cliente</Label>
                    <Select value={taskForm.client_id || "__none__"} onValueChange={(value) => setTaskForm({ ...taskForm, client_id: value === "__none__" ? "" : value })}>
                      <SelectTrigger id="client">
                        <SelectValue placeholder="Selecione um cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Nenhum</SelectItem>
                        {clients.map(client => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="business">Negócio</Label>
                    <Select value={taskForm.business_id || "__none__"} onValueChange={(value) => setTaskForm({ ...taskForm, business_id: value === "__none__" ? "" : value })}>
                      <SelectTrigger id="business">
                        <SelectValue placeholder="Selecione um negócio" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Nenhum</SelectItem>
                        {businesses.map(business => (
                          <SelectItem key={business.id} value={business.id}>
                            {business.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleAddTask} className="w-full">
                  {editingTask ? "Atualizar Tarefa" : "Criar Tarefa"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Multi-task Dialog */}
          <Dialog open={isMultiTaskDialogOpen} onOpenChange={setIsMultiTaskDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={() => {
                setMultiTaskForm({
                  tasks: "",
                  priority: "medium",
                  block_id: "",
                  client_id: "",
                  business_id: "",
                });
              }}>
                <ListPlus className="mr-2 h-4 w-4" />
                Múltiplas Tarefas
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Múltiplas Tarefas</DialogTitle>
                <DialogDescription>
                  Digite uma tarefa por linha. Todas serão criadas com as mesmas configurações.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="multiTasks">Tarefas (uma por linha) *</Label>
                  <Textarea
                    id="multiTasks"
                    value={multiTaskForm.tasks}
                    onChange={(e) => setMultiTaskForm({ ...multiTaskForm, tasks: e.target.value })}
                    placeholder={"Criar layout da página inicial\nRevisar documento de requisitos\nEnviar relatório semanal"}
                    rows={6}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {multiTaskForm.tasks.split('\n').filter(l => l.trim()).length} tarefa(s) para criar
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="multiPriority">Prioridade</Label>
                    <Select value={multiTaskForm.priority} onValueChange={(value: any) => setMultiTaskForm({ ...multiTaskForm, priority: value })}>
                      <SelectTrigger id="multiPriority">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="multiBlock">Bloco</Label>
                    <Select value={multiTaskForm.block_id} onValueChange={(value) => setMultiTaskForm({ ...multiTaskForm, block_id: value })}>
                      <SelectTrigger id="multiBlock">
                        <SelectValue placeholder="Selecione um bloco" />
                      </SelectTrigger>
                      <SelectContent>
                        {blocks.map(block => (
                          <SelectItem key={block.id} value={block.id}>
                            {block.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="multiClient">Cliente</Label>
                    <Select value={multiTaskForm.client_id || "__none__"} onValueChange={(value) => setMultiTaskForm({ ...multiTaskForm, client_id: value === "__none__" ? "" : value })}>
                      <SelectTrigger id="multiClient">
                        <SelectValue placeholder="Selecione um cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Nenhum</SelectItem>
                        {clients.map(client => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="multiBusiness">Negócio</Label>
                    <Select value={multiTaskForm.business_id || "__none__"} onValueChange={(value) => setMultiTaskForm({ ...multiTaskForm, business_id: value === "__none__" ? "" : value })}>
                      <SelectTrigger id="multiBusiness">
                        <SelectValue placeholder="Selecione um negócio" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Nenhum</SelectItem>
                        {businesses.map(business => (
                          <SelectItem key={business.id} value={business.id}>
                            {business.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleAddMultipleTasks} className="w-full">
                  Criar {multiTaskForm.tasks.split('\n').filter(l => l.trim()).length} Tarefa(s)
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tarefas por Bloco</CardTitle>
            <CardDescription>Distribuição de tarefas pelos blocos</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={analyticsData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))">
                  {analyticsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Prioridades</CardTitle>
            <CardDescription>Distribuição por nível de prioridade</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, count }) => `${name}: ${count}`}
                  outerRadius={80}
                  fill="hsl(var(--primary))"
                  dataKey="count"
                >
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={(event: DragStartEvent) => {
          setActiveId(event.active.id as string);
        }}
        onDragEnd={(event: DragEndEvent) => {
          setActiveId(null);
          const { active, over } = event;
          if (!over) return;
          
          const taskId = active.id as string;
          const overId = over.id as string;
          
          // Check if dropped on a block
          if (overId.startsWith('block-')) {
            const blockId = overId.replace('block-', '');
            const task = tasks.find(t => t.id === taskId);
            if (task && task.block_id !== blockId) {
              handleMoveTaskToBlock(taskId, blockId);
            }
          }
        }}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {filteredBlocks.map((block) => (
            <DroppableBlock
              key={block.id}
              block={block}
              tasks={tasksByBlock[block.id] || []}
              allBlocks={blocks}
              onEdit={openEditTask}
              onDelete={handleDeleteTask}
              onEditBlock={openEditBlock}
              onDeleteBlock={handleDeleteBlock}
              onMoveTaskToBlock={handleMoveTaskToBlock}
              onChangeOrder={handleChangeBlockOrder}
              onChangeTaskOrder={handleChangeTaskOrder}
            />
          ))}
          
          {filteredBlocks.length === 0 && (
            <Card className="w-80">
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <p className="text-muted-foreground mb-4">
                    {selectedClientFilter === "all" ? "Nenhum bloco criado ainda" : "Nenhum bloco para este cliente"}
                  </p>
                  <Button onClick={() => setIsBlockDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Bloco
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DragOverlay>
          {activeId ? (() => {
            const draggedTask = tasks.find(t => t.id === activeId);
            if (!draggedTask) return null;
            return (
              <Card className="w-72 shadow-2xl rotate-2 border-l-4 opacity-90" style={{ borderLeftColor: blocks.find(b => b.id === draggedTask.block_id)?.color || 'hsl(var(--primary))' }}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <h4 className="font-semibold text-sm">{draggedTask.title}</h4>
                  </div>
                </CardContent>
              </Card>
            );
          })() : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};
