import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  Plus, 
  MoreVertical, 
  GripVertical, 
  Calendar, 
  Flag, 
  Edit2, 
  Trash2, 
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Layout
} from "lucide-react";
import { 
  DndContext, 
  DragEndEvent, 
  DragOverlay, 
  DragStartEvent, 
  PointerSensor, 
  useSensor, 
  useSensors,
  closestCorners,
  rectIntersection
} from "@dnd-kit/core";
import { 
  SortableContext, 
  verticalListSortingStrategy, 
  arrayMove 
} from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { KanbanColumn } from "./KanbanColumn";
import { TaskCard } from "./TaskCard";
import { TaskDialog } from "./TaskDialog";
import { BlockDialog } from "./BlockDialog";
import { useAuth } from "@/contexts/AuthContext";

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: "low" | "medium" | "high";
  category?: string;
  due_date?: string;
  block_id: string;
  client_id?: string;
  task_order: number;
  created_at: string;
}

interface Block {
  id: string;
  name: string;
  color: string;
  order_index: number;
}

interface KanbanBoardProps {
  userId: string;
  userName: string;
  teamContext?: any;
}

export const KanbanBoard = ({ userId, userName, teamContext }: KanbanBoardProps) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  
  // Dialog states
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingBlock, setEditingBlock] = useState<Block | null>(null);

  const effectiveUserId = teamContext?.adminUserId || user?.id;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    fetchData();
  }, [userId, effectiveUserId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch Blocks (Columns)
      const { data: blocksData, error: blocksError } = await supabase
        .from("task_blocks")
        .select("*")
        .eq("user_id", effectiveUserId)
        .eq("client_id", userId)
        .order("order_index");

      if (blocksError) throw blocksError;

      // If no blocks exist, create default ones
      let currentBlocks = blocksData || [];
      if (currentBlocks.length === 0) {
        const defaultBlocks = [
          { name: "A fazer", color: "#94a3b8", order_index: 0, user_id: effectiveUserId, client_id: userId },
          { name: "Em progresso", color: "#3b82f6", order_index: 1, user_id: effectiveUserId, client_id: userId },
          { name: "Concluído", color: "#22c55e", order_index: 2, user_id: effectiveUserId, client_id: userId },
        ];
        
        const { data: insertedBlocks, error: insertError } = await supabase
          .from("task_blocks")
          .insert(defaultBlocks)
          .select();
        
        if (insertError) throw insertError;
        currentBlocks = insertedBlocks || [];
      }
      setBlocks(currentBlocks);

      // Fetch Tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", effectiveUserId)
        .eq("client_id", userId)
        .order("task_order");

      if (tasksError) throw tasksError;
      setTasks(tasksData || []);

    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Erro ao carregar dados do gerenciador");
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [tasks, searchQuery]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Check if dropping over a block or another task
    let targetBlockId = "";
    if (over.data.current?.type === "block") {
      targetBlockId = over.data.current.blockId;
    } else if (over.data.current?.type === "task") {
      targetBlockId = over.data.current.task.block_id;
    }

    if (!targetBlockId) return;

    const activeTaskIndex = tasks.findIndex(t => t.id === activeId);
    const task = tasks[activeTaskIndex];

    if (task.block_id !== targetBlockId || activeId !== overId) {
      // Logic for reordering and moving
      const updatedTasks = [...tasks];
      const movedTask = { ...task, block_id: targetBlockId };
      
      // If reordering in the same column
      if (task.block_id === targetBlockId) {
        const oldIndex = updatedTasks.findIndex(t => t.id === activeId);
        const newIndex = updatedTasks.findIndex(t => t.id === overId);
        const reordered = arrayMove(updatedTasks, oldIndex, newIndex);
        
        // Update task_order locally
        const finalTasks = reordered.map((t, index) => ({ ...t, task_order: index }));
        setTasks(finalTasks);
        
        // Update DB
        await updateTasksInDB(finalTasks);
      } else {
        // Moving to a different column
        const filtered = updatedTasks.filter(t => t.id !== activeId);
        const overIndex = filtered.findIndex(t => t.id === overId);
        
        const finalIndex = overIndex === -1 ? filtered.length : overIndex;
        filtered.splice(finalIndex, 0, movedTask);
        
        const finalTasks = filtered.map((t, index) => ({ ...t, task_order: index }));
        setTasks(finalTasks);
        
        // Update DB
        await updateTasksInDB(finalTasks);
      }
    }
  };

  const updateTasksInDB = async (updatedTasks: Task[]) => {
    try {
      // In a real scenario, we'd only update the changed ones to be efficient
      // For simplicity here, we update all task_orders and block_ids
      const updates = updatedTasks.map(t => ({
        id: t.id,
        block_id: t.block_id,
        task_order: t.task_order,
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase.from("tasks").upsert(updates);
      if (error) throw error;
    } catch (error) {
      console.error("Error updating tasks:", error);
      toast.error("Erro ao salvar alterações");
      fetchData(); // Rollback
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase.from("tasks").delete().eq("id", taskId);
      if (error) throw error;
      setTasks(tasks.filter(t => t.id !== taskId));
      toast.success("Tarefa removida");
    } catch (error) {
      toast.error("Erro ao remover tarefa");
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsTaskDialogOpen(true);
  };

  const handleAddBlock = () => {
    setEditingBlock(null);
    setIsBlockDialogOpen(true);
  };

  const handleEditBlock = (block: Block) => {
    setEditingBlock(block);
    setIsBlockDialogOpen(true);
  };

  const handleDeleteBlock = async (blockId: string) => {
    const hasTasks = tasks.some(t => t.block_id === blockId);
    if (hasTasks) {
      toast.error("Não é possível excluir um bloco que contém tarefas.");
      return;
    }

    try {
      const { error } = await supabase.from("task_blocks").delete().eq("id", blockId);
      if (error) throw error;
      setBlocks(blocks.filter(b => b.id !== blockId));
      toast.success("Bloco removido");
    } catch (error) {
      toast.error("Erro ao remover bloco");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Sincronizando tarefas...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 h-full min-h-[600px]">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-card p-4 rounded-xl border shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Pesquisar tarefas..." 
            className="pl-9 bg-background/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Button variant="outline" size="sm" onClick={handleAddBlock} className="gap-2">
            <Layout className="h-4 w-4" />
            Novo Bloco
          </Button>
          <Button size="sm" onClick={() => { setEditingTask(null); setIsTaskDialogOpen(true); }} className="gap-2 shadow-md">
            <Plus className="h-4 w-4" />
            Nova Tarefa
          </Button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6 overflow-x-auto pb-6 -mx-4 px-4 scrollbar-hide">
          {blocks.map((block) => (
            <KanbanColumn
              key={block.id}
              block={block}
              tasks={filteredTasks.filter(t => t.block_id === block.id)}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
              onEditBlock={handleEditBlock}
              onDeleteBlock={handleDeleteBlock}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="w-80 opacity-90 scale-105 rotate-2 cursor-grabbing">
              <TaskCard task={activeTask} isOverlay />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <TaskDialog
        open={isTaskDialogOpen}
        onOpenChange={setIsTaskDialogOpen}
        task={editingTask}
        blocks={blocks}
        userId={userId}
        effectiveUserId={effectiveUserId}
        onSuccess={fetchData}
      />

      <BlockDialog
        open={isBlockDialogOpen}
        onOpenChange={setIsBlockDialogOpen}
        block={editingBlock}
        userId={userId}
        effectiveUserId={effectiveUserId}
        onSuccess={fetchData}
      />
    </div>
  );
};
