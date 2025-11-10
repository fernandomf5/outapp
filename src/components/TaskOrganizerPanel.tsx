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
import { Plus, Edit2, Trash2, Calendar, Flag, MoreVertical, GripVertical } from "lucide-react";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCorners, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
  block_id?: string;
  client_id?: string | null;
  created_at: string;
  updated_at: string;
}

interface TaskBlock {
  id: string;
  name: string;
  color: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

interface SortableTaskProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

function SortableTask({ task, onEdit, onDelete }: SortableTaskProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

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

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="mb-3 hover:shadow-md transition-smooth">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing mt-1">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="font-semibold text-sm truncate">{task.title}</h4>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
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
              
              <div className="flex flex-wrap gap-2 items-center">
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
                    {new Date(task.due_date).toLocaleDateString("pt-BR")}
                  </Badge>
                )}
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
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onEditBlock: (block: TaskBlock) => void;
  onDeleteBlock: (id: string) => void;
}

function DroppableBlock({ block, tasks, onEdit, onDelete, onEditBlock, onDeleteBlock }: DroppableBlockProps) {
  const taskIds = tasks.map(t => t.id);
  
  const { setNodeRef, isOver } = useSortable({
    id: block.id,
    data: {
      type: 'block',
      block,
    }
  });

  return (
    <div ref={setNodeRef} className="flex-shrink-0 w-80">
      <Card className={`h-full flex flex-col ${isOver ? 'ring-2 ring-primary' : ''}`}>
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
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-4 min-h-[200px]">
          <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
            {tasks.map((task) => (
              <SortableTask
                key={task.id}
                task={task}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
            {tasks.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Arraste tarefas para cá
              </div>
            )}
          </SortableContext>
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
  
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high",
    category: "",
    due_date: "",
    block_id: "",
    client_id: "",
  });

  const [blockForm, setBlockForm] = useState({
    name: "",
    color: "#6366f1",
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    loadData();
    loadClients();
  }, []);

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
          })
          .eq("id", editingBlock.id);

        if (error) throw error;
        toast.success("Bloco atualizado com sucesso!");
      } else {
        const { error } = await supabase.from("task_blocks").insert({
          user_id: user.id,
          name: blockForm.name,
          color: blockForm.color,
          order_index: blocks.length,
        });

        if (error) throw error;
        toast.success("Bloco criado com sucesso!");
      }

      setIsBlockDialogOpen(false);
      setEditingBlock(null);
      setBlockForm({ name: "", color: "#6366f1" });
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

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };


  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setOverId(null);

    if (!over) return;

    const taskId = active.id as string;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Find the target block - could be the over.id itself or a parent block
    let targetBlockId: string | null = null;
    
    // Check if over is a block
    const overBlock = blocks.find(b => b.id === over.id);
    if (overBlock) {
      targetBlockId = overBlock.id;
    } else {
      // If over is a task, find its block
      const overTask = tasks.find(t => t.id === over.id);
      if (overTask && overTask.block_id) {
        targetBlockId = overTask.block_id;
      }
    }

    if (targetBlockId && task.block_id !== targetBlockId) {
      try {
        const { error } = await supabase
          .from("tasks")
          .update({ block_id: targetBlockId })
          .eq("id", taskId);

        if (error) throw error;
        
        // Update local state
        setTasks(prev => prev.map(t => 
          t.id === taskId ? { ...t, block_id: targetBlockId } : t
        ));
        
        toast.success("Tarefa movida com sucesso!");
      } catch (error: any) {
        toast.error("Erro ao mover tarefa: " + error.message);
      }
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

  const allBlockIds = blocks.map(b => b.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold">Organizador de Tarefas</h2>
          <p className="text-muted-foreground">Organize suas tarefas com drag-and-drop</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isBlockDialogOpen} onOpenChange={setIsBlockDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={() => {
                setEditingBlock(null);
                setBlockForm({ name: "", color: "#6366f1" });
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
                <div>
                  <Label htmlFor="client">Cliente</Label>
                  <Select value={taskForm.client_id} onValueChange={(value) => setTaskForm({ ...taskForm, client_id: value })}>
                    <SelectTrigger id="client">
                      <SelectValue placeholder="Selecione um cliente (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhum</SelectItem>
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
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          <SortableContext items={allBlockIds} strategy={verticalListSortingStrategy}>
            {blocks.map((block) => (
              <DroppableBlock
                key={block.id}
                block={block}
                tasks={tasks.filter(t => t.block_id === block.id)}
                onEdit={openEditTask}
                onDelete={handleDeleteTask}
                onEditBlock={openEditBlock}
                onDeleteBlock={handleDeleteBlock}
              />
            ))}
          </SortableContext>
          
          {blocks.length === 0 && (
            <Card className="w-80">
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <p className="text-muted-foreground mb-4">Nenhum bloco criado ainda</p>
                  <Button onClick={() => setIsBlockDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Primeiro Bloco
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DragOverlay>
          {activeId ? (
            <Card className="w-80 opacity-90 rotate-3 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4" />
                  <span className="font-semibold">
                    {tasks.find(t => t.id === activeId)?.title}
                  </span>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};
