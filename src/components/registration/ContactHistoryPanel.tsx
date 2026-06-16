import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { SecureDeleteDialog } from "@/components/ui/secure-delete-dialog";
import { toast } from "sonner";
import {
  Globe,
  Megaphone,
  PenTool,
  Smartphone,
  ShoppingCart,
  Mail,
  Search,
  Video,
  Camera,
  BookOpen,
  Headphones,
  Briefcase,
  PlusCircle,
  Pencil,
  Trash2,
  CalendarDays,
  CheckCircle2,
  Clock,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";

interface ContactHistoryPanelProps {
  contactId: string;
  contactName: string;
}

interface HistoryItem {
  id: string;
  service_type: string;
  title: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
  is_public: boolean;
  created_at: string;
}

const SERVICE_TYPES = [
  { value: "website", label: "Criação de Site", icon: Globe, color: "text-blue-500" },
  { value: "traffic", label: "Gestão de Tráfego Pago", icon: Megaphone, color: "text-orange-500" },
  { value: "logo", label: "Criação de Logo", icon: PenTool, color: "text-purple-500" },
  { value: "social", label: "Gestão de Redes Sociais", icon: Camera, color: "text-pink-500" },
  { value: "app", label: "Criação de Aplicativo", icon: Smartphone, color: "text-cyan-500" },
  { value: "ecommerce", label: "E-commerce", icon: ShoppingCart, color: "text-green-500" },
  { value: "email", label: "E-mail Marketing", icon: Mail, color: "text-red-500" },
  { value: "seo", label: "SEO", icon: Search, color: "text-yellow-500" },
  { value: "video", label: "Produção de Vídeo", icon: Video, color: "text-indigo-500" },
  { value: "course", label: "Curso / Treinamento", icon: BookOpen, color: "text-emerald-500" },
  { value: "consulting", label: "Consultoria", icon: Headphones, color: "text-teal-500" },
  { value: "other", label: "Outro Serviço", icon: Briefcase, color: "text-muted-foreground" },
];

const STATUS_OPTIONS = [
  { value: "in_progress", label: "Em andamento", icon: Clock, color: "bg-blue-500/15 text-blue-500" },
  { value: "completed", label: "Concluído", icon: CheckCircle2, color: "bg-green-500/15 text-green-500" },
  { value: "paused", label: "Pausado", icon: Clock, color: "bg-amber-500/15 text-amber-500" },
  { value: "cancelled", label: "Cancelado", icon: Clock, color: "bg-red-500/15 text-red-500" },
];

function getServiceMeta(type: string) {
  return SERVICE_TYPES.find((s) => s.value === type) || SERVICE_TYPES[SERVICE_TYPES.length - 1];
}

function getStatusMeta(status: string) {
  return STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0];
}

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("pt-BR");
}

export function ContactHistoryPanel({ contactId, contactName }: ContactHistoryPanelProps) {
  const { user } = useAuth();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<HistoryItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toDelete, setToDelete] = useState<HistoryItem | null>(null);

  const [form, setForm] = useState({
    service_type: "website",
    title: "",
    description: "",
    start_date: "",
    end_date: "",
    status: "in_progress",
    is_public: true,
  });

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("contact_history")
      .select("*")
      .eq("contact_id", contactId)
      .order("start_date", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Erro ao carregar histórico: " + error.message);
    } else {
      setItems((data as any) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (contactId) fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contactId]);

  const openNew = () => {
    setEditing(null);
    setForm({
      service_type: "website",
      title: "",
      description: "",
      start_date: "",
      end_date: "",
      status: "in_progress",
      is_public: true,
    });
    setDialogOpen(true);
  };

  const openEdit = (item: HistoryItem) => {
    setEditing(item);
    setForm({
      service_type: item.service_type,
      title: item.title,
      description: item.description || "",
      start_date: item.start_date || "",
      end_date: item.end_date || "",
      status: item.status,
      is_public: item.is_public,
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!user) return;
    if (!form.title.trim()) {
      toast.error("Informe um título");
      return;
    }
    setSaving(true);
    const payload = {
      user_id: user.id,
      contact_id: contactId,
      service_type: form.service_type,
      title: form.title.trim(),
      description: form.description.trim() || null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      status: form.status,
      is_public: form.is_public,
    };
    const { error } = editing
      ? await supabase.from("contact_history").update(payload).eq("id", editing.id)
      : await supabase.from("contact_history").insert(payload);
    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar: " + error.message);
      return;
    }
    toast.success(editing ? "Histórico atualizado" : "Histórico adicionado");
    setDialogOpen(false);
    fetchItems();
  };

  const remove = async () => {
    if (!toDelete) return;
    const { error } = await supabase.from("contact_history").delete().eq("id", toDelete.id);
    if (error) {
      toast.error("Erro ao excluir: " + error.message);
    } else {
      toast.success("Registro excluído");
      fetchItems();
    }
    setDeleteOpen(false);
    setToDelete(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Histórico de {contactName}</h3>
          <p className="text-sm text-muted-foreground">
            Registre tudo que foi feito para este cliente em uma timeline.
          </p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <PlusCircle className="h-4 w-4" /> Novo registro
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhum registro no histórico ainda. Clique em "Novo registro" para começar.
          </CardContent>
        </Card>
      ) : (
        <div className="relative pl-6">
          <div className="absolute left-2 top-2 bottom-2 w-px bg-border" />
          <div className="space-y-6">
            {items.map((item) => {
              const meta = getServiceMeta(item.service_type);
              const status = getStatusMeta(item.status);
              const Icon = meta.icon;
              const StatusIcon = status.icon;
              return (
                <div key={item.id} className="relative">
                  <div className="absolute -left-[22px] top-1.5 h-9 w-9 rounded-full bg-card border-2 border-border flex items-center justify-center">
                    <Icon className={`h-4 w-4 ${meta.color}`} />
                  </div>
                  <Card className="ml-6">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-semibold">{item.title}</h4>
                            <Badge variant="outline" className="text-xs">
                              {meta.label}
                            </Badge>
                            <Badge className={`text-xs gap-1 ${status.color} border-0`}>
                              <StatusIcon className="h-3 w-3" />
                              {status.label}
                            </Badge>
                            {item.is_public ? (
                              <Badge variant="outline" className="text-xs gap-1">
                                <Eye className="h-3 w-3" /> Visível ao cliente
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs gap-1 text-muted-foreground">
                                <EyeOff className="h-3 w-3" /> Privado
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <CalendarDays className="h-3 w-3" />
                            <span>
                              {formatDate(item.start_date)} → {formatDate(item.end_date)}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => openEdit(item)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setToDelete(item);
                              setDeleteOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      {item.description && (
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {item.description}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar registro" : "Novo registro"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de serviço</Label>
              <Select
                value={form.service_type}
                onValueChange={(v) => setForm({ ...form, service_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_TYPES.map((s) => {
                    const I = s.icon;
                    return (
                      <SelectItem key={s.value} value={s.value}>
                        <div className="flex items-center gap-2">
                          <I className={`h-4 w-4 ${s.color}`} />
                          {s.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ex: Site institucional v2"
              />
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="O que foi entregue, detalhes do projeto..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Início</Label>
                <Input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Fim</Label>
                <Input
                  type="date"
                  value={form.end_date}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <Label>Visível ao cliente</Label>
                <p className="text-xs text-muted-foreground">
                  Mostrar este item na área de membros do cliente.
                </p>
              </div>
              <Switch
                checked={form.is_public}
                onCheckedChange={(v) => setForm({ ...form, is_public: v })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editing ? "Salvar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SecureDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={remove}
        title="Excluir registro do histórico"
        description="Esta ação não pode ser desfeita."
        itemName={toDelete?.title}
      />
    </div>
  );
}
