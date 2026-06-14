import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, GripVertical } from "lucide-react";

interface Block {
  id: string;
  name: string;
}

interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: "low" | "medium" | "high";
  category?: string;
  due_date?: string;
  block_id: string;
  checklist?: ChecklistItem[] | null;
}

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  blocks: Block[];
  userId: string;
  effectiveUserId: string;
  onSuccess: () => void;
}


export const TaskDialog = ({ 
  open, 
  onOpenChange, 
  task, 
  blocks, 
  userId, 
  effectiveUserId,
  onSuccess 
}: TaskDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high",
    category: "",
    due_date: "",
    block_id: ""
  });
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newItemText, setNewItemText] = useState("");

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || "",
        priority: task.priority,
        category: task.category || "",
        due_date: task.due_date || "",
        block_id: task.block_id
      });
      setChecklist(Array.isArray(task.checklist) ? task.checklist : []);
    } else {
      setFormData({
        title: "",
        description: "",
        priority: "medium",
        category: "",
        due_date: "",
        block_id: blocks[0]?.id || ""
      });
      setChecklist([]);
    }
    setNewItemText("");
  }, [task, blocks, open]);

  const addChecklistItem = () => {
    const text = newItemText.trim();
    if (!text) return;
    setChecklist((prev) => [
      ...prev,
      { id: crypto.randomUUID(), text, done: false }
    ]);
    setNewItemText("");
  };

  const toggleChecklistItem = (id: string) => {
    setChecklist((prev) =>
      prev.map((it) => (it.id === id ? { ...it, done: !it.done } : it))
    );
  };

  const updateChecklistText = (id: string, text: string) => {
    setChecklist((prev) =>
      prev.map((it) => (it.id === id ? { ...it, text } : it))
    );
  };

  const removeChecklistItem = (id: string) => {
    setChecklist((prev) => prev.filter((it) => it.id !== id));
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.block_id) {
      toast.error("Por favor, preencha o título e selecione um bloco");
      return;
    }

    try {
      setLoading(true);
      
      if (task) {
        // Update
        const { error } = await supabase
          .from("tasks")
          .update({
            title: formData.title,
            description: formData.description,
            priority: formData.priority,
            category: formData.category,
            due_date: formData.due_date || null,
            block_id: formData.block_id,
            updated_at: new Date().toISOString()
          })
          .eq("id", task.id);
        
        if (error) throw error;
        toast.success("Tarefa atualizada");
      } else {
        // Create
        // Get max order in the block
        const { data: lastTask } = await supabase
          .from("tasks")
          .select("task_order")
          .eq("block_id", formData.block_id)
          .order("task_order", { ascending: false })
          .limit(1)
          .maybeSingle();

        const nextOrder = (lastTask?.task_order ?? -1) + 1;

        const { error } = await supabase
          .from("tasks")
          .insert({
            title: formData.title,
            description: formData.description,
            priority: formData.priority,
            category: formData.category,
            due_date: formData.due_date || null,
            block_id: formData.block_id,
            user_id: effectiveUserId,
            client_id: userId,
            task_order: nextOrder,
            status: "pending"
          });
        
        if (error) throw error;
        toast.success("Tarefa criada");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving task:", error);
      toast.error("Erro ao salvar tarefa");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{task ? "Editar Tarefa" : "Nova Tarefa"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input 
              id="title" 
              placeholder="Ex: Reunião de alinhamento" 
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição (Opcional)</Label>
            <Textarea 
              id="description" 
              placeholder="Detalhes sobre a tarefa..." 
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="min-h-[100px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select 
                value={formData.priority} 
                onValueChange={(val: any) => setFormData({ ...formData, priority: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Bloco / Status</Label>
              <Select 
                value={formData.block_id} 
                onValueChange={(val) => setFormData({ ...formData, block_id: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
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
            <div className="space-y-2">
              <Label htmlFor="category">Categoria (Opcional)</Label>
              <Input 
                id="category" 
                placeholder="Ex: Design, Bug" 
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_date">Data de Entrega</Label>
              <Input 
                id="due_date" 
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : task ? "Salvar Alterações" : "Criar Tarefa"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
