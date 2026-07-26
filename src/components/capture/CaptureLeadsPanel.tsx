import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Search, Download, Trash2, Eye, UserPlus, Filter, Loader2, Copy, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const STATUS_OPTIONS = [
  { value: "novo", label: "Novo" },
  { value: "em_contato", label: "Em contato" },
  { value: "qualificado", label: "Qualificado" },
  { value: "cliente", label: "Cliente" },
  { value: "descartado", label: "Descartado" },
];

interface Lead {
  id: string;
  page_id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  source: string | null;
  data: Record<string, any>;
  utm: Record<string, any>;
  referrer: string | null;
  created_at: string;
}

interface Props {
  pageId?: string;
  pages: { id: string; title: string }[];
}

export const CaptureLeadsPanel = ({ pageId, pages }: Props) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pageFilter, setPageFilter] = useState(pageId || "all");
  const [detail, setDetail] = useState<Lead | null>(null);
  const [toDelete, setToDelete] = useState<Lead | null>(null);

  const load = async () => {
    setLoading(true);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return setLoading(false);
    let q = supabase.from("capture_leads").select("*").eq("user_id", auth.user.id).order("created_at", { ascending: false });
    if (pageFilter !== "all") q = q.eq("page_id", pageFilter);
    const { data, error } = await q;
    if (error) toast.error("Erro ao carregar leads");
    setLeads(((data || []) as any[]).map((l) => ({ ...l, data: l.data || {}, utm: l.utm || {} })));
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageFilter]);

  useEffect(() => {
    setPageFilter(pageId || "all");
  }, [pageId]);

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    return leads.filter((l) => {
      if (statusFilter !== "all" && l.status !== statusFilter) return false;
      if (!term) return true;
      return JSON.stringify({ n: l.name, e: l.email, p: l.phone, d: l.data }).toLowerCase().includes(term);
    });
  }, [leads, search, statusFilter]);

  const pageName = (id: string) => pages.find((p) => p.id === id)?.title || "Página removida";

  const updateStatus = async (lead: Lead, status: string) => {
    setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, status } : l)));
    const { error } = await supabase.from("capture_leads").update({ status }).eq("id", lead.id);
    if (error) {
      toast.error("Erro ao atualizar status");
      load();
    }
  };

  const remove = async () => {
    if (!toDelete) return;
    const { error } = await supabase.from("capture_leads").delete().eq("id", toDelete.id);
    if (error) return toast.error("Erro ao excluir");
    setLeads((prev) => prev.filter((l) => l.id !== toDelete.id));
    setToDelete(null);
    toast.success("Lead excluído");
  };

  const sendToContacts = async (lead: Lead) => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const { error } = await supabase.from("contacts").insert({
      user_id: auth.user.id,
      name: lead.name || lead.email || "Lead sem nome",
      email: lead.email,
      phone: lead.phone,
      source: `Página de Captura: ${pageName(lead.page_id)}`,
      notes: Object.entries(lead.data).map(([k, v]) => `${k}: ${v}`).join("\n"),
    });
    if (error) return toast.error(error.message);
    toast.success("Lead enviado para Cadastros");
  };

  const exportCsv = () => {
    if (!filtered.length) return toast.error("Nenhum lead para exportar");
    const keys = Array.from(new Set(filtered.flatMap((l) => Object.keys(l.data))));
    const header = ["Data", "Página", "Status", ...keys];
    const rows = filtered.map((l) => [
      new Date(l.created_at).toLocaleString("pt-BR"),
      pageName(l.page_id),
      l.status,
      ...keys.map((k) => String(l.data[k] ?? "")),
    ]);
    const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
    const url = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-captura-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const today = leads.filter((l) => new Date(l.created_at).toDateString() === new Date().toDateString()).length;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "Total de leads", value: leads.length },
          { label: "Hoje", value: today },
          { label: "Novos", value: leads.filter((l) => l.status === "novo").length },
          { label: "Clientes", value: leads.filter((l) => l.status === "cliente").length },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-2xl font-bold">{s.value}</p>
          </Card>
        ))}
      </div>

      <Card className="p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="h-9 pl-8" placeholder="Pesquisar leads..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={pageFilter} onValueChange={setPageFilter}>
            <SelectTrigger className="h-9 w-full sm:w-52"><Filter className="mr-1 h-3.5 w-3.5" /><SelectValue /></SelectTrigger>
            <SelectContent className="z-[200]">
              <SelectItem value="all">Todas as páginas</SelectItem>
              {pages.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-full sm:w-40"><SelectValue /></SelectTrigger>
            <SelectContent className="z-[200]">
              <SelectItem value="all">Todos os status</SelectItem>
              {STATUS_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="h-9" onClick={load}><RefreshCw className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" className="h-9" onClick={exportCsv}><Download className="mr-1 h-4 w-4" />CSV</Button>
        </div>
      </Card>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">Nenhum lead capturado ainda.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((l) => (
            <Card key={l.id} className="p-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{l.name || l.email || "Lead sem nome"}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {l.email || "—"} {l.phone ? `• ${l.phone}` : ""} • {pageName(l.page_id)} • {new Date(l.created_at).toLocaleString("pt-BR")}
                  </p>
                </div>
                <Select value={l.status} onValueChange={(v) => updateStatus(l, v)}>
                  <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent className="z-[200]">
                    {STATUS_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Ver dados" onClick={() => setDetail(l)}><Eye className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Enviar para Cadastros" onClick={() => sendToContacts(l)}><UserPlus className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" title="Excluir" onClick={() => setToDelete(l)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="z-[250] max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader><DialogTitle>Dados do lead</DialogTitle></DialogHeader>
          {detail && (
            <div className="space-y-3">
              {Object.entries(detail.data).map(([k, v]) => (
                <div key={k} className="rounded-md border p-2">
                  <Label className="text-[11px] uppercase text-muted-foreground">{k}</Label>
                  <div className="flex items-start justify-between gap-2">
                    <p className="break-all text-sm">{String(v) || "—"}</p>
                    <Button variant="ghost" size="sm" className="h-6 w-6 shrink-0 p-0" onClick={() => { navigator.clipboard.writeText(String(v)); toast.success("Copiado"); }}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
              <div className="rounded-md border p-2 text-xs text-muted-foreground">
                <p>Origem: {detail.source || "—"}</p>
                <p>Referência: {detail.referrer || "direto"}</p>
                {Object.entries(detail.utm || {}).filter(([, v]) => v).map(([k, v]) => <p key={k}>{k}: {String(v)}</p>)}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => sendToContacts(detail)}><UserPlus className="mr-1 h-4 w-4" />Enviar para Cadastros</Button>
                <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(Object.entries(detail.data).map(([k, v]) => `${k}: ${v}`).join("\n")); toast.success("Dados copiados"); }}>
                  <Copy className="mr-1 h-4 w-4" />Copiar tudo
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent className="z-[300]">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lead?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={remove} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CaptureLeadsPanel;
