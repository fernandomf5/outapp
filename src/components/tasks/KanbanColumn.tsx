import { useDroppable } from "@dnd-kit/core";
import { 
  SortableContext, 
  verticalListSortingStrategy 
} from "@dnd-kit/sortable";
import { TaskCard } from "./TaskCard";
import { 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Plus 
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: "low" | "medium" | "high";
  category?: string;
  due_date?: string;
  block_id: string;
  task_order: number;
}

interface Block {
  id: string;
  name: string;
  color: string;
}

interface KanbanColumnProps {
  block: Block;
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onEditBlock: (block: Block) => void;
  onDeleteBlock: (id: string) => void;
}

export const KanbanColumn = ({ 
  block, 
  tasks, 
  onEditTask, 
  onDeleteTask, 
  onEditBlock, 
  onDeleteBlock 
}: KanbanColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: block.id,
    data: {
      type: "block",
      blockId: block.id
    }
  });

  return (
    <div 
      ref={setNodeRef}
      className={`flex flex-col w-80 shrink-0 rounded-xl bg-secondary/30 border-2 transition-all duration-200 ${
        isOver ? 'border-primary/50 ring-4 ring-primary/5' : 'border-transparent'
      }`}
    >
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: block.color }} />
          <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">{block.name}</h3>
          <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-bold">
            {tasks.length}
          </Badge>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
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
              Excluir Bloco
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex-1 flex flex-col gap-3 p-3 min-h-[150px]">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard 
              key={task.id} 
              task={task} 
              onEdit={() => onEditTask(task)}
              onDelete={() => onDeleteTask(task.id)}
            />
          ))}
        </SortableContext>
        
        {tasks.length === 0 && !isOver && (
          <div className="flex flex-col items-center justify-center py-8 opacity-20 pointer-events-none">
            <Plus className="h-8 w-8 mb-1" />
            <span className="text-xs font-medium uppercase tracking-widest">Vazio</span>
          </div>
        )}
      </div>
    </div>
  );
};
