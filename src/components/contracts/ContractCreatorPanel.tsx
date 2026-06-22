import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, FileText, Copy, Eye, Trash2, Download, PenLine, History, Send, Files, RotateCcw } from "lucide-react";
import SignaturePadField from "./SignaturePadField";
import A4ContractPreview from "./A4ContractPreview";
import jsPDF from "jspdf";
import { format } from "date-fns";

type Contract = any;

const STATUS_LABEL: Record<string,{label:string;variant:any}> = {
  draft: { label: "Rascunho", variant: "secondary" },
  sent: { label: "Enviado", variant: "default" },
  signed_by_client: { label: "Assinado pelo Cliente", variant: "default" },
  completed: { label: "Concluído", variant: "default" },
  cancelled: { label: "Cancelado", variant: "destructive" },
};

const TEMPLATE = `CONTRATO DE PRESTAÇÃO DE SERVIÇOS

Pelo presente instrumento particular, de um lado [NOME DA EMPRESA], doravante denominada CONTRATADA, e de outro lado [NOME DO CLIENTE], doravante denominado CONTRATANTE, têm entre si justo e contratado o seguinte:

CLÁUSULA 1ª - DO OBJETO
O presente contrato tem por objeto...

CLÁUSULA 2ª - DO PRAZO
O prazo de execução será de...

CLÁUSULA 3ª - DO VALOR E FORMA DE PAGAMENTO
Pelos serviços prestados, o CONTRATANTE pagará à CONTRATADA o valor de R$ ...

CLÁUSULA 4ª - DAS OBRIGAÇÕES
A CONTRATADA se obriga a...
O CONTRATANTE se obriga a...

CLÁUSULA 5ª - DO FORO
Fica eleito o foro da comarca de ... para dirimir quaisquer questões oriundas do presente contrato.`;

export function ContractCreatorPanel() {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState<Contract | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [signOpen, setSignOpen] = useState<Contract | null>(null);
  const [editing, setEditing] = useState<Contract | null>(null);
  const [companySignature, setCompanySignature] = useState<string | null>(null);
  const [companySigner, setCompanySigner] = useState("");

  const [form, setForm] = useState({
    title: "", content: TEMPLATE,
    client_name: "", client_email: "", client_phone: "", client_document: "",
    company_name: "", company_document: "",
    access_code: "",
  });

  useEffect(() => { load(); }, []);

  // Realtime: live status updates + popup when client signs
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`contracts-rt-${user.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "contracts", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const newRow: any = payload.new;
          const oldRow: any = payload.old;
          setContracts(prev => prev.map(c => c.id === newRow.id ? { ...c, ...newRow } : c));
          if (oldRow?.status !== "signed_by_client" && newRow.status === "signed_by_client") {
            toast.success(`✍️ ${newRow.client_name || "O cliente"} assinou o contrato!`, {
              description: newRow.title,
              duration: 10000,
              action: { label: "Ver", onClick: () => setSignOpen(newRow) },
            });
            try {
              if ("Notification" in window && Notification.permission === "granted") {
                new Notification("Contrato assinado pelo cliente", { body: `${newRow.client_name || "Cliente"} assinou: ${newRow.title}` });
              } else if ("Notification" in window && Notification.permission !== "denied") {
                Notification.requestPermission();
              }
            } catch {}
          } else if (oldRow?.status !== "completed" && newRow.status === "completed") {
            toast.success(`Contrato concluído: ${newRow.title}`);
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  async function load() {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from("contracts").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setContracts(data || []);
    setLoading(false);
  }

  function openNew() {
    setEditing(null);
    setForm({
      title: "", content: TEMPLATE,
      client_name: "", client_email: "", client_phone: "", client_document: "",
      company_name: "", company_document: "",
      access_code: Math.random().toString(36).slice(2, 8).toUpperCase(),
    });
    setEditorOpen(true);
  }

  function openEdit(c: Contract) {
    setEditing(c);
    setForm({
      title: c.title, content: c.content || "",
      client_name: c.client_name || "", client_email: c.client_email || "",
      client_phone: c.client_phone || "", client_document: c.client_document || "",
      company_name: c.company_name || "", company_document: c.company_document || "",
      access_code: c.access_code,
    });
    setEditorOpen(true);
  }

  async function save() {
    if (!form.title.trim()) return toast.error("Informe o título");
    if (!form.access_code.trim()) return toast.error("Informe o código de acesso");
    if (editing) {
      const { error } = await supabase.from("contracts").update(form).eq("id", editing.id);
      if (error) return toast.error(error.message);
      await supabase.from("contract_history").insert({ contract_id: editing.id, event_type: "updated", description: "Contrato editado" });
      toast.success("Contrato atualizado");
    } else {
      const { data, error } = await supabase.from("contracts").insert({ ...form, user_id: user!.id }).select().single();
      if (error) return toast.error(error.message);
      await supabase.from("contract_history").insert({ contract_id: data.id, event_type: "created", description: "Contrato criado" });
      toast.success("Contrato criado");
    }
    setEditorOpen(false);
    load();
  }

  async function remove(c: Contract) {
    if (!confirm("Excluir este contrato?")) return;
    await supabase.from("contracts").delete().eq("id", c.id);
    toast.success("Excluído");
    load();
  }

  function publicLink(c: Contract) {
    return `${window.location.origin}/contrato/${c.public_slug}`;
  }

  async function copyLink(c: Contract) {
    await navigator.clipboard.writeText(publicLink(c));
    if (c.status === "draft") {
      await supabase.from("contracts").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", c.id);
      await supabase.from("contract_history").insert({ contract_id: c.id, event_type: "sent", description: "Link enviado" });
      load();
    }
    toast.success("Link copiado!");
  }

  async function openHistory(c: Contract) {
    setHistoryOpen(c);
    const { data } = await supabase.from("contract_history").select("*").eq("contract_id", c.id).order("created_at", { ascending: false });
    setHistory(data || []);
  }

  function downloadPDF(c: Contract) {
    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 40;
    let y = 60;
    pdf.setFontSize(16);
    pdf.text(c.title, margin, y);
    y += 24;
    pdf.setFontSize(10);
    pdf.text(`Empresa: ${c.company_name || "-"}`, margin, y); y += 14;
    pdf.text(`Cliente: ${c.client_name || "-"} | ${c.client_email || "-"}`, margin, y); y += 20;
    pdf.setFontSize(11);
    const lines = pdf.splitTextToSize(c.content || "", 515);
    lines.forEach((line: string) => {
      if (y > 760) { pdf.addPage(); y = 60; }
      pdf.text(line, margin, y); y += 14;
    });
    y += 20;
    if (c.client_signature) {
      if (y > 680) { pdf.addPage(); y = 60; }
      pdf.setFontSize(10);
      pdf.text("Assinatura do Cliente:", margin, y); y += 8;
      pdf.addImage(c.client_signature, "PNG", margin, y, 180, 60);
      pdf.text(`${c.client_signer_name || c.client_name || ""} - ${c.client_signed_at ? format(new Date(c.client_signed_at), "dd/MM/yyyy HH:mm") : ""}`, margin, y + 72);
      y += 90;
    }
    if (c.company_signature) {
      if (y > 680) { pdf.addPage(); y = 60; }
      pdf.text("Assinatura da Empresa:", margin, y); y += 8;
      pdf.addImage(c.company_signature, "PNG", margin, y, 180, 60);
      pdf.text(`${c.company_signer_name || c.company_name || ""} - ${c.company_signed_at ? format(new Date(c.company_signed_at), "dd/MM/yyyy HH:mm") : ""}`, margin, y + 72);
    }
    pdf.save(`${c.title || "contrato"}.pdf`);
  }

  async function signAsCompany() {
    if (!signOpen) return;
    if (!companySignature) return toast.error("Faça ou digite sua assinatura");
    if (!companySigner.trim()) return toast.error("Informe o nome do signatário");
    const { error } = await supabase.from("contracts").update({
      company_signature: companySignature,
      company_signer_name: companySigner,
      company_signed_at: new Date().toISOString(),
      status: "completed",
    }).eq("id", signOpen.id);
    if (error) return toast.error(error.message);
    await supabase.from("contract_history").insert({ contract_id: signOpen.id, event_type: "company_signed", description: `Empresa assinou (${companySigner})` });
    toast.success("Contrato assinado e concluído!");
    setSignOpen(null);
    setCompanySigner("");
    setCompanySignature(null);
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><FileText className="h-6 w-6" /> Criador de Contratos</h2>
          <p className="text-muted-foreground text-sm">Crie, envie e assine contratos digitalmente.</p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" /> Novo Contrato</Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : contracts.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">Nenhum contrato criado ainda.</p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {contracts.map(c => {
            const s = STATUS_LABEL[c.status] || STATUS_LABEL.draft;
            return (
              <Card key={c.id} className="p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold truncate">{c.title}</h3>
                      <Badge variant={s.variant}>{s.label}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      Cliente: {c.client_name || "—"} · Código: <span className="font-mono">{c.access_code}</span> · {c.views_count} visualizações
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Criado em {format(new Date(c.created_at), "dd/MM/yyyy HH:mm")}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => copyLink(c)}><Copy className="h-4 w-4 mr-1" />Link</Button>
                    <Button size="sm" variant="outline" asChild><a href={publicLink(c)} target="_blank" rel="noopener noreferrer"><Eye className="h-4 w-4" /></a></Button>
                    <Button size="sm" variant="outline" onClick={() => openHistory(c)}><History className="h-4 w-4" /></Button>
                    {c.status === "signed_by_client" && (
                      <Button size="sm" onClick={() => setSignOpen(c)}><PenLine className="h-4 w-4 mr-1" />Assinar</Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => downloadPDF(c)}><Download className="h-4 w-4" /></Button>
                    <Button size="sm" variant="outline" onClick={() => openEdit(c)}>Editar</Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(c)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Editar" : "Novo"} Contrato</DialogTitle></DialogHeader>
          <Tabs defaultValue="basic">
            <TabsList>
              <TabsTrigger value="basic">Dados</TabsTrigger>
              <TabsTrigger value="content">Conteúdo</TabsTrigger>
              <TabsTrigger value="preview">Visualizar (A4)</TabsTrigger>
            </TabsList>
            <TabsContent value="basic" className="space-y-3">
              <div><Label>Título *</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
              <div><Label>Código de Acesso *</Label><Input value={form.access_code} onChange={e => setForm({ ...form, access_code: e.target.value.toUpperCase() })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Empresa</Label><Input value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} /></div>
                <div><Label>CNPJ/CPF Empresa</Label><Input value={form.company_document} onChange={e => setForm({ ...form, company_document: e.target.value })} /></div>
                <div><Label>Nome do Cliente</Label><Input value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} /></div>
                <div><Label>CPF/CNPJ Cliente</Label><Input value={form.client_document} onChange={e => setForm({ ...form, client_document: e.target.value })} /></div>
                <div><Label>Email Cliente</Label><Input value={form.client_email} onChange={e => setForm({ ...form, client_email: e.target.value })} /></div>
                <div><Label>Telefone Cliente</Label><Input value={form.client_phone} onChange={e => setForm({ ...form, client_phone: e.target.value })} /></div>
              </div>
            </TabsContent>
            <TabsContent value="content">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Conteúdo do Contrato</Label>
                  <Textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={24} className="font-mono text-sm" />
                </div>
                <div>
                  <Label>Pré-visualização ao vivo</Label>
                  <A4ContractPreview title={form.title} companyName={form.company_name} clientName={form.client_name} content={form.content} />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="preview">
              <A4ContractPreview title={form.title} companyName={form.company_name} clientName={form.client_name} content={form.content} />
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditorOpen(false)}>Cancelar</Button>
            <Button onClick={save}><Send className="h-4 w-4 mr-2" />Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!historyOpen} onOpenChange={o => !o && setHistoryOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Histórico — {historyOpen?.title}</DialogTitle></DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {history.length === 0 ? <p className="text-sm text-muted-foreground">Sem eventos.</p> :
              history.map(h => (
                <div key={h.id} className="border-l-2 border-primary pl-3 py-1">
                  <p className="text-sm font-medium">{h.description || h.event_type}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(h.created_at), "dd/MM/yyyy HH:mm")}</p>
                </div>
              ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!signOpen} onOpenChange={o => !o && setSignOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Assinatura da Empresa</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome do Signatário</Label><Input value={companySigner} onChange={e => setCompanySigner(e.target.value)} /></div>
            <div>
              <Label>Sua Assinatura</Label>
              <SignaturePadField onChange={setCompanySignature} defaultName={companySigner} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSignOpen(null)}>Cancelar</Button>
            <Button onClick={signAsCompany}>Confirmar Assinatura</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
