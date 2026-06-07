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
  logo_url?: string;
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
      style={{ 
        borderColor: block.color,
        boxShadow: `0 10px 30px -10px rgba(0,0,0,0.3), inset 0 -6px 0 ${block.color}40, 0 4px 0 ${block.color}60`,
        backgroundColor: block.color + '05',
        transform: isOver ? 'translateY(-4px) scale(1.01)' : 'none'
      }}
      className={`flex flex-col w-80 shrink-0 rounded-2xl border-[3px] transition-all duration-300 relative overflow-hidden ${
        isOver ? 'shadow-2xl' : ''
      }`}
    >
      <div 
        className="p-4 flex items-center justify-between border-b border-border/5 rounded-t-2xl relative"
        style={{ backgroundColor: block.color + '15' }}
      >
        <div 
          className="absolute inset-x-0 bottom-0 h-[2px]" 
          style={{ backgroundColor: block.color }}
        />
        <div className="flex items-center gap-3">
          {block.logo_url ? (
            <img 
              src={block.logo_url} 
              alt={block.name} 
              className="w-8 h-8 rounded-lg object-cover border border-border/20 shadow-sm"
            />
          ) : (
            <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: block.color }} />
          )}
          <h3 className="font-bold text-sm uppercase tracking-widest text-foreground/80">{block.name}</h3>
          <Badge variant="outline" className="h-5 px-2 text-[10px] font-bold bg-background/50 border-border/50">
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
          <div className="flex flex-col items-center justify-center py-12 opacity-10 pointer-events-none border-2 border-dashed border-foreground/20 rounded-xl m-2">
            <Plus className="h-8 w-8 mb-2" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-center">Arraste aqui ou<br/>adicione tarefa</span>
          </div>
        )}
      </div>
    </div>
  );
};
