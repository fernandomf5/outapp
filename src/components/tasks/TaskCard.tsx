import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { 
  Calendar, 
  Flag, 
  MoreVertical, 
  Edit2, 
  Trash2,
  Clock
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: "low" | "medium" | "high";
  category?: string;
  due_date?: string;
}

interface TaskCardProps {
  task: Task;
  isOverlay?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const TaskCard = ({ task, isOverlay, onEdit, onDelete }: TaskCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: task.id,
    data: {
      type: "task",
      task
    }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-500/10 text-red-600 border-red-200 dark:bg-red-500/20 dark:text-red-400";
      case "medium": return "bg-amber-500/10 text-amber-600 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400";
      case "low": return "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400";
      default: return "bg-slate-500/10 text-slate-600 border-slate-200";
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
    <Card 
      ref={setNodeRef}
      style={style}
      className={`group cursor-grab active:cursor-grabbing hover:shadow-md transition-all duration-200 border-border/60 ${
        isOverlay ? 'shadow-2xl ring-2 ring-primary border-primary rotate-1' : ''
      }`}
      {...attributes}
      {...listeners}
    >
      <CardContent className="p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-semibold text-sm leading-tight line-clamp-2 flex-1 group-hover:text-primary transition-colors">
            {task.title}
          </h4>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit?.(); }}>
                <Edit2 className="mr-2 h-3.5 w-3.5" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-destructive" 
                onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Badge variant="outline" className={`px-1.5 py-0 text-[10px] font-bold border ${getPriorityColor(task.priority)}`}>
            <Flag className="h-3 w-3 mr-1 fill-current" />
            {getPriorityLabel(task.priority)}
          </Badge>
          
          {task.category && (
            <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-medium bg-secondary/50">
              {task.category}
            </Badge>
          )}

          {task.due_date && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium ml-auto">
              <Clock className="h-3 w-3" />
              {new Date(task.due_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
