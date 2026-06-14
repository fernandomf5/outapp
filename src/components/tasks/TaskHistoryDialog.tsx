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
import {
  Search,
  Loader2,
  History,
  CheckCircle2,
  Circle,
  Calendar,
  User as UserIcon,
  ListChecks,
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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks.filter((t) => {
      if (selectedClient !== "all" && t.client_id !== selectedClient)
        return false;
      const block = t.block_id ? blocks[t.block_id] : undefined;
      const done = isDoneBlock(block?.name);
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
      const block = t.block_id ? blocks[t.block_id] : undefined;
      if (isDoneBlock(block?.name)) done++;
    });
    return { total: filtered.length, done, pending: filtered.length - done };
  }, [filtered, blocks]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Histórico de Tarefas
          </DialogTitle>
          <DialogDescription>
            Veja todas as tarefas realizadas por cliente — filtre por nome,
            status e busca.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
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

          <div className="flex gap-2 text-xs">
            <Badge variant="secondary">Total: {stats.total}</Badge>
            <Badge className="bg-green-500/15 text-green-600 hover:bg-green-500/15">
              Concluídas: {stats.done}
            </Badge>
            <Badge className="bg-amber-500/15 text-amber-600 hover:bg-amber-500/15">
              Pendentes: {stats.pending}
            </Badge>
          </div>
        </div>

        <ScrollArea className="flex-1 -mx-6 px-6 mt-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <History className="h-10 w-10 mx-auto opacity-20 mb-2" />
              <p>Nenhuma tarefa encontrada.</p>
            </div>
          ) : (
            <div className="space-y-2 pb-4">
              {filtered.map((t) => {
                const block = t.block_id ? blocks[t.block_id] : undefined;
                const done = isDoneBlock(block?.name);
                const checklist = Array.isArray(t.checklist) ? t.checklist : [];
                const checklistDone = checklist.filter((i) => i.done).length;
                const contactName = t.client_id
                  ? contacts[t.client_id]?.name
                  : null;
                return (
                  <div
                    key={t.id}
                    className="rounded-lg border p-3 hover:bg-muted/40 transition-colors"
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
                              done ? "line-through text-muted-foreground" : ""
                            }`}
                          >
                            {t.title}
                          </h4>
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
                                (checklistDone / checklist.length) * 100
                              }
                              className="h-1.5"
                            />
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
                          {contactName && (
                            <span className="flex items-center gap-1">
                              <UserIcon className="h-3 w-3" />
                              {contactName}
                            </span>
                          )}
                          {t.due_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Prazo:{" "}
                              {format(new Date(t.due_date), "dd/MM/yyyy", {
                                locale: ptBR,
                              })}
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
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
