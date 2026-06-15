import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { toast } from "sonner";
import {
  Search,
  Loader2,
  History,
  CheckCircle2,
  Circle,
  Calendar,
  User as UserIcon,
  ListChecks,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TaskHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  effectiveUserId: string;
}

interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

interface HistoryTask {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  client_id: string | null;
  block_id: string | null;
  checklist: ChecklistItem[] | null;
  archived?: boolean | null;
  archived_at?: string | null;
}

interface Block {
  id: string;
  name: string;
  color: string;
}

interface Contact {
  id: string;
  name: string;
}

const isDoneBlock = (name?: string) => {
  if (!name) return false;
  const n = name.toLowerCase();
  return (
    n.includes("conclu") ||
    n.includes("finaliz") ||
    n.includes("done") ||
    n.includes("feito")
  );
};

export const TaskHistoryDialog = ({
  open,
  onOpenChange,
  effectiveUserId,
}: TaskHistoryDialogProps) => {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<HistoryTask[]>([]);
  const [blocks, setBlocks] = useState<Record<string, Block>>({});
  const [contacts, setContacts] = useState<Record<string, Contact>>({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "done" | "pending">(
    "all"
  );
  const [selectedClient, setSelectedClient] = useState<string>("all");
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    if (open && effectiveUserId) fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, effectiveUserId]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [tasksRes, blocksRes, contactsRes] = await Promise.all([
        supabase
          .from("tasks")
          .select("*")
          .eq("user_id", effectiveUserId)
          .order("updated_at", { ascending: false }),
        supabase
          .from("task_blocks")
          .select("id, name, color")
          .eq("user_id", effectiveUserId),
        supabase
          .from("contacts")
          .select("id, name")
          .eq("user_id", effectiveUserId),
      ]);

      if (tasksRes.error) throw tasksRes.error;
      if (blocksRes.error) throw blocksRes.error;
      if (contactsRes.error) throw contactsRes.error;

      const blocksMap: Record<string, Block> = {};
      (blocksRes.data || []).forEach((b: any) => (blocksMap[b.id] = b));
      const contactsMap: Record<string, Contact> = {};
      (contactsRes.data || []).forEach(
        (c: any) => (contactsMap[c.id] = c)
      );

      setBlocks(blocksMap);
      setContacts(contactsMap);
      setTasks((tasksRes.data || []) as any);
    } catch (e) {
      console.error("Erro ao carregar histórico:", e);
    } finally {
      setLoading(false);
    }
  };

  const clientList = useMemo(() => {
    const ids = new Set<string>();
    tasks.forEach((t) => {
      if (t.client_id) ids.add(t.client_id);
    });
    return Array.from(ids)
      .map((id) => contacts[id])
      .filter(Boolean)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [tasks, contacts]);

  const isTaskDone = (t: HistoryTask) => {
    if (t.archived) return true;
    const block = t.block_id ? blocks[t.block_id] : undefined;
    return isDoneBlock(block?.name);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks.filter((t) => {
      if (selectedClient !== "all" && t.client_id !== selectedClient)
        return false;
      const done = isTaskDone(t);
      if (statusFilter === "done" && !done) return false;
      if (statusFilter === "pending" && done) return false;
      if (!q) return true;
      const contactName = t.client_id
        ? contacts[t.client_id]?.name?.toLowerCase() || ""
        : "";
      return (
        t.title.toLowerCase().includes(q) ||
        (t.description?.toLowerCase().includes(q) ?? false) ||
        contactName.includes(q)
      );
    });
  }, [tasks, search, statusFilter, selectedClient, blocks, contacts]);

  const stats = useMemo(() => {
    let done = 0;
    filtered.forEach((t) => {
      if (isTaskDone(t)) done++;
    });
    return { total: filtered.length, done, pending: filtered.length - done };
  }, [filtered, blocks]);

  // Group filtered tasks by client (or "Sem cliente")
  const grouped = useMemo(() => {
    const map = new Map<string, { name: string; items: HistoryTask[] }>();
    filtered.forEach((t) => {
      const key = t.client_id || "__none__";
      const name = t.client_id
        ? contacts[t.client_id]?.name || "Cliente removido"
        : "Sem cliente";
      if (!map.has(key)) map.set(key, { name, items: [] });
      map.get(key)!.items.push(t);
    });
    return Array.from(map.entries())
      .map(([key, v]) => ({ key, ...v }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [filtered, contacts]);

  const handleClearHistory = async () => {
    try {
      setClearing(true);
      const ids = filtered
        .filter((t) => {
          const block = t.block_id ? blocks[t.block_id] : undefined;
          return isDoneBlock(block?.name);
        })
        .map((t) => t.id);

      if (ids.length === 0) {
        toast.info("Nenhuma tarefa concluída para excluir.");
        return;
      }

      const { error } = await supabase.from("tasks").delete().in("id", ids);
      if (error) throw error;

      setTasks((prev) => prev.filter((t) => !ids.includes(t.id)));
      toast.success(`Histórico zerado: ${ids.length} tarefa(s) excluída(s).`);
      setConfirmClearOpen(false);
    } catch (e: any) {
      console.error(e);
      toast.error("Erro ao excluir histórico: " + (e?.message || ""));
    } finally {
      setClearing(false);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
      setTasks((prev) => prev.filter((t) => t.id !== id));
      toast.success("Tarefa removida do histórico.");
    } catch (e: any) {
      toast.error("Erro: " + (e?.message || ""));
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl h-[85vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Histórico de Tarefas
            </DialogTitle>
            <DialogDescription>
              Veja todas as tarefas realizadas por cliente — filtre, organize e
              gerencie o histórico.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 px-6 pb-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título, descrição ou cliente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="px-3 py-2 rounded-md border border-input bg-background text-sm flex-1 min-w-[180px]"
              >
                <option value="all">Todos os clientes</option>
                {clientList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <div className="flex gap-1 rounded-md border border-input p-1">
                {(["all", "pending", "done"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-3 py-1 text-xs rounded transition-colors ${
                      statusFilter === s
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                  >
                    {s === "all"
                      ? "Todas"
                      : s === "pending"
                      ? "Pendentes"
                      : "Concluídas"}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex gap-2 text-xs">
                <Badge variant="secondary">Total: {stats.total}</Badge>
                <Badge className="bg-green-500/15 text-green-600 hover:bg-green-500/15">
                  Concluídas: {stats.done}
                </Badge>
                <Badge className="bg-amber-500/15 text-amber-600 hover:bg-amber-500/15">
                  Pendentes: {stats.pending}
                </Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmClearOpen(true)}
                disabled={stats.done === 0}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Zerar histórico
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1 min-h-0">
            <div className="px-6 py-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : grouped.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <History className="h-10 w-10 mx-auto opacity-20 mb-2" />
                  <p>Nenhuma tarefa encontrada.</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {grouped.map((group) => (
                    <div key={group.key}>
                      <div className="flex items-center gap-2 mb-2 sticky top-0 bg-background/95 backdrop-blur py-1 z-10">
                        <UserIcon className="h-4 w-4 text-primary" />
                        <h3 className="font-semibold text-sm">{group.name}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {group.items.length}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        {group.items.map((t) => {
                          const block = t.block_id
                            ? blocks[t.block_id]
                            : undefined;
                          const done = isDoneBlock(block?.name);
                          const checklist = Array.isArray(t.checklist)
                            ? t.checklist
                            : [];
                          const checklistDone = checklist.filter(
                            (i) => i.done
                          ).length;
                          return (
                            <div
                              key={t.id}
                              className="rounded-lg border p-3 hover:bg-muted/40 transition-colors group"
                            >
                              <div className="flex items-start gap-3">
                                {done ? (
                                  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                                ) : (
                                  <Circle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2 flex-wrap">
                                    <h4
                                      className={`font-medium ${
                                        done
                                          ? "line-through text-muted-foreground"
                                          : ""
                                      }`}
                                    >
                                      {t.title}
                                    </h4>
                                    <div className="flex items-center gap-1">
                                      {block && (
                                        <Badge
                                          variant="outline"
                                          style={{
                                            borderColor: block.color,
                                            color: block.color,
                                          }}
                                        >
                                          {block.name}
                                        </Badge>
                                      )}
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                                        onClick={() => handleDeleteTask(t.id)}
                                        title="Excluir esta tarefa"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  </div>

                                  {t.description && (
                                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                      {t.description}
                                    </p>
                                  )}

                                  {checklist.length > 0 && (
                                    <div className="mt-2 space-y-1">
                                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <ListChecks className="h-3.5 w-3.5" />
                                        {checklistDone}/{checklist.length} itens
                                      </div>
                                      <Progress
                                        value={
                                          (checklistDone / checklist.length) *
                                          100
                                        }
                                        className="h-1.5"
                                      />
                                    </div>
                                  )}

                                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
                                    {t.due_date && (
                                      <span className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        Prazo:{" "}
                                        {format(
                                          new Date(t.due_date),
                                          "dd/MM/yyyy",
                                          { locale: ptBR }
                                        )}
                                      </span>
                                    )}
                                    <span>
                                      Atualizada:{" "}
                                      {format(
                                        new Date(t.updated_at),
                                        "dd/MM/yyyy 'às' HH:mm",
                                        { locale: ptBR }
                                      )}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={confirmClearOpen}
        onOpenChange={setConfirmClearOpen}
        onConfirm={handleClearHistory}
        title="Zerar histórico?"
        description={`Isso excluirá permanentemente ${stats.done} tarefa(s) concluída(s) do filtro atual. Esta ação não pode ser desfeita.`}
        
      />
    </>
  );
};
