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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Block {
  id: string;
  name: string;
  color: string;
}

interface BlockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  block: Block | null;
  userId: string;
  effectiveUserId: string;
  onSuccess: () => void;
}

const COLORS = [
  "#94a3b8", // Slate
  "#ef4444", // Red
  "#f97316", // Orange
  "#f59e0b", // Amber
  "#eab308", // Yellow
  "#84cc16", // Lime
  "#22c55e", // Green
  "#10b981", // Emerald
  "#06b6d4", // Cyan
  "#0ea5e9", // Sky
  "#3b82f6", // Blue
  "#6366f1", // Indigo
  "#8b5cf6", // Violet
  "#a855f7", // Purple
  "#d946ef", // Fuchsia
  "#ec4899", // Pink
];

export const BlockDialog = ({ 
  open, 
  onOpenChange, 
  block, 
  userId, 
  effectiveUserId,
  onSuccess 
}: BlockDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    color: COLORS[0]
  });

  useEffect(() => {
    if (block) {
      setFormData({
        name: block.name,
        color: block.color
      });
    } else {
      setFormData({
        name: "",
        color: COLORS[0]
      });
    }
  }, [block, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error("Por favor, informe o nome do bloco");
      return;
    }

    try {
      setLoading(true);
      
      if (block) {
        // Update
        const { error } = await supabase
          .from("task_blocks")
          .update({
            name: formData.name,
            color: formData.color,
            updated_at: new Date().toISOString()
          })
          .eq("id", block.id);
        
        if (error) throw error;
        toast.success("Bloco atualizado");
      } else {
        // Create
        // Get max order
        const { data: lastBlock } = await supabase
          .from("task_blocks")
          .select("order_index")
          .eq("client_id", userId)
          .order("order_index", { ascending: false })
          .limit(1)
          .maybeSingle();

        const nextOrder = (lastBlock?.order_index ?? -1) + 1;

        const { error } = await supabase
          .from("task_blocks")
          .insert({
            name: formData.name,
            color: formData.color,
            user_id: effectiveUserId,
            client_id: userId,
            order_index: nextOrder
          });
        
        if (error) throw error;
        toast.success("Bloco criado");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving block:", error);
      toast.error(`Erro ao salvar bloco: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{block ? "Editar Bloco" : "Criar Bloco"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="block-name">Nome do Bloco</Label>
            <Input 
              id="block-name" 
              placeholder="Ex: Em revisão" 
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-3">
            <Label>Cor de Destaque</Label>
            <div className="grid grid-cols-8 gap-2">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`h-6 w-6 rounded-full border-2 transition-transform hover:scale-125 ${
                    formData.color === color ? "border-primary scale-110" : "border-transparent"
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setFormData({ ...formData, color })}
                />
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : block ? "Salvar Alterações" : "Criar Bloco"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
