import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, ListPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Block {
  id: string;
  name: string;
  color: string;
}

interface BulkTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blocks: Block[];
  userId: string;
  effectiveUserId: string;
  onSuccess: () => void;
}

export const BulkTaskDialog = ({
  open,
  onOpenChange,
  blocks,
  userId,
  effectiveUserId,
  onSuccess,
}: BulkTaskDialogProps) => {
  const [blockId, setBlockId] = useState<string>("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setBlockId(blocks[0]?.id || "");
      setPriority("medium");
      setText("");
    }
  }, [open, blocks]);

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const handleSave = async () => {
    if (!blockId) {
      toast.error("Selecione um bloco");
      return;
    }
    if (lines.length === 0) {
      toast.error("Digite ao menos uma tarefa");
      return;
    }

    try {
      setLoading(true);

      const { data: lastTask } = await supabase
        .from("tasks")
        .select("task_order")
        .eq("block_id", blockId)
        .order("task_order", { ascending: false })
        .limit(1)
        .maybeSingle();

      const startOrder = (lastTask?.task_order ?? -1) + 1;

      const rows = lines.map((title, idx) => ({
        title,
        description: "",
        priority,
        block_id: blockId,
        user_id: effectiveUserId,
        client_id: userId,
        task_order: startOrder + idx,
        status: "pending",
      }));

      const { error } = await supabase.from("tasks").insert(rows as any);
      if (error) throw error;

      toast.success(`${lines.length} tarefa(s) criada(s)`);
      onSuccess();
      onOpenChange(false);
    } catch (e: any) {
      console.error(e);
      toast.error("Erro ao criar tarefas em massa");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListPlus className="h-5 w-5 text-primary" />
            Adicionar tarefas em massa
          </DialogTitle>
          <DialogDescription>
            Digite <strong>uma tarefa por linha</strong>. Todas serão criadas no
            bloco selecionado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Bloco</Label>
              <Select value={blockId} onValueChange={setBlockId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {blocks.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select
                value={priority}
                onValueChange={(v: any) => setPriority(v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tarefas (uma por linha)</Label>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`Ligar para o cliente\nEnviar proposta\nAgendar reunião`}
              rows={10}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              {lines.length} tarefa(s) prontas para criar
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading || lines.length === 0}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Criando...
              </>
            ) : (
              <>Criar {lines.length > 0 ? `${lines.length} ` : ""}tarefa(s)</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
