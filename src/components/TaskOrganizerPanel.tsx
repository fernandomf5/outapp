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
import { Plus, Edit2, Trash2, Calendar, Flag, MoreVertical, ChevronLeft, ChevronRight, MoveRight } from "lucide-react";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, pointerWithin, closestCenter, PointerSensor, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

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
  created_at: string;
  updated_at: string;
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

function TaskCard({ task, blocks, tasksInBlock, onEdit, onDelete, onMoveToBlock, onChangeOrder }: TaskCardProps) {

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-destructive text-destructive-foreground";
      case "medium": return "bg-warning text-warning-foreground";
      case "low": return "bg-muted text-muted-foreground";
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

  const currentBlock = blocks.find(b => b.id === task.block_id);

  return (
    <Card className="mb-3 hover:shadow-md transition-smooth">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="font-semibold text-sm truncate flex-1">{task.title}</h4>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0">
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
          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{task.description}</p>
        )}
        
        <div className="flex flex-wrap gap-2 items-center mb-3">
          <Badge variant="secondary" className={getPriorityColor(task.priority)}>
            <Flag className="h-3 w-3 mr-1" />
            {getPriorityLabel(task.priority)}
          </Badge>
          
          {task.category && (
            <Badge variant="outline">{task.category}</Badge>
          )}
          
          {task.due_date && (
            <Badge variant="outline" className="text-xs">
              <Calendar className="h-3 w-3 mr-1" />
              {task.due_date.split('-').reverse().join('/')}
            </Badge>
          )}
        </div>

        <div className="pt-2 border-t border-border/50">
          <div className="flex items-center justify-between gap-2 mb-2">
            <Label className="text-xs text-muted-foreground">Ordem</Label>
            <Input
              type="number"
              min={1}
              max={tasksInBlock.length}
              defaultValue={(task.task_order ?? 0) + 1}
              onBlur={(e) => {
                const val = parseInt(e.currentTarget.value, 10);
                if (!Number.isFinite(val)) return;
                const clamped = Math.max(1, Math.min(tasksInBlock.length, val));
                if (clamped !== (task.task_order ?? 0) + 1) {
                  onChangeOrder(task.id, clamped);
                }
                e.currentTarget.value = String(clamped);
              }}
              className="h-7 w-16"
            />
          </div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Mover para</Label>
          <div className="flex items-center gap-2">
            <MoveRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <Select 
              value={task.block_id || ""} 
              onValueChange={(value) => onMoveToBlock(task.id, value)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Selecione o bloco" />
              </SelectTrigger>
              <SelectContent>
                {blocks.map((block) => (
                  <SelectItem key={block.id} value={block.id}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-2 h-2 rounded-full" 
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
      </CardContent>
    </Card>
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
  
  return (
    <div className="flex-shrink-0 w-80">
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-3" style={{ borderTopColor: block.color, borderTopWidth: '4px' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: block.color }}
              />
              <CardTitle className="text-base">{block.name}</CardTitle>
              <Badge variant="secondary">{tasks.length}</Badge>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
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
                  className="h-7 w-16"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
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
        <CardContent className="flex-1 overflow-y-auto p-4 min-h-[300px]">
          {sortedTasks.map((task) => (
            <TaskCard
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
            <div className="text-center py-8 text-muted-foreground text-sm">
              Nenhuma tarefa neste bloco
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export const TaskOrganizerPanel = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [blocks, setBlocks] = useState<TaskBlock[]>([]);
  const [clients, setClients] = useState<Array<{id: string, name: string}>>([]);
  const [loading, setLoading] = useState(true);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingBlock, setEditingBlock] = useState<TaskBlock | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [selectedClientFilter, setSelectedClientFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
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
  });

  const [blockForm, setBlockForm] = useState({
    name: "",
    color: "#6366f1",
    client_id: "",
  });

  const [taskClientCategories, setTaskClientCategories] = useState<Array<{id:string; name:string}>>([]);

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

  useEffect(() => {
    loadData();
    loadClients();
  }, []);

  useEffect(() => {
    if (taskForm.client_id) {
      loadClientCategories(taskForm.client_id);
    } else {
      setTaskClientCategories([]);
    }
  }, [taskForm.client_id]);

  const loadClients = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("customers")
        .select("id, name")
        .eq("user_id", user.id)
        .order("name", { ascending: true });

      if (error) throw error;
      setClients(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar clientes:", error?.message || error);
      setClients([]);
    }
  };

  const loadClientCategories = async (clientId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("task_categories")
        .select("id, name")
        .eq("user_id", user.id)
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("task_categories")
        .insert({
          user_id: user.id,
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load blocks
      const { data: blocksData, error: blocksError } = await supabase
        .from("task_blocks")
        .select("*")
        .eq("user_id", user.id)
        .order("order_index", { ascending: true });

      if (blocksError) throw blocksError;

      // If no blocks exist, create default ones
      if (!blocksData || blocksData.length === 0) {
        await createDefaultBlocks(user.id);
        await loadData();
        return;
      }

      setBlocks(blocksData);

      // Load tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

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
        };
        // Somente adiciona client_id se existir na base (evita erro de tipagem/coluna)
        if (taskForm.client_id !== undefined) {
          updatePayload.client_id = taskForm.client_id || null;
        }

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
        };
        if (taskForm.client_id !== undefined && taskForm.client_id) {
          insertPayload.client_id = taskForm.client_id;
        }

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
      });
      loadData();
    } catch (error: any) {
      toast.error("Erro ao salvar tarefa: " + error.message);
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
          order_index: blocks.length,
        });

        if (error) throw error;
        toast.success("Bloco criado com sucesso!");
      }

      setIsBlockDialogOpen(false);
      setEditingBlock(null);
      setBlockForm({ name: "", color: "#6366f1", client_id: "" });
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
    });
    setIsTaskDialogOpen(true);
  };

  const openEditBlock = (block: TaskBlock) => {
    setEditingBlock(block);
    setBlockForm({
      name: block.name,
      color: block.color,
      client_id: block.client_id || "",
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

  // Filter tasks and blocks by selected client
  const filteredTasksBase = selectedClientFilter === "all" 
    ? tasks 
    : selectedClientFilter === "none"
    ? tasks.filter(task => !task.client_id)
    : tasks.filter(task => task.client_id === selectedClientFilter);

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

  const filteredBlocks = selectedClientFilter === "all"
    ? blocks
    : selectedClientFilter === "none"
    ? blocks.filter(block => !block.client_id)
    : blocks.filter(block => block.client_id === selectedClientFilter || !block.client_id);

  const tasksByBlock = filteredTasks.reduce((acc, task) => {
    if (!acc[task.block_id || '']) {
      acc[task.block_id || ''] = [];
    }
    acc[task.block_id || ''].push(task);
    return acc;
  }, {} as Record<string, typeof tasks>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold">Organizador de Tarefas</h2>
          <p className="text-muted-foreground">Organize suas tarefas com drag-and-drop</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <Select value={selectedClientFilter} onValueChange={setSelectedClientFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por cliente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Clientes</SelectItem>
              <SelectItem value="none">Sem Cliente</SelectItem>
              {clients.map(client => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          <Dialog open={isBlockDialogOpen} onOpenChange={setIsBlockDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={() => {
                setEditingBlock(null);
                setBlockForm({ name: "", color: "#6366f1", client_id: selectedClientFilter !== "all" ? selectedClientFilter : "" });
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
                      <SelectItem value="__none__">Sem Cliente (Global)</SelectItem>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
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
                <div>
                  <Label htmlFor="client">Cliente</Label>
                  <Select value={taskForm.client_id || "__none__"} onValueChange={(value) => setTaskForm({ ...taskForm, client_id: value === "__none__" ? null : value })}>
                    <SelectTrigger id="client">
                      <SelectValue placeholder="Selecione um cliente (opcional)" />
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
                <Button onClick={handleAddTask} className="w-full">
                  {editingTask ? "Atualizar Tarefa" : "Criar Tarefa"}
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
    </div>
  );
};
