import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Mail, MessageCircle, Search, Send, Loader2, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

interface ContactRow { user_id: string; full_name: string | null; email: string | null; phone: string | null; created_at: string }

const waLink = (phone: string) => {
  const d = phone.replace(/\D/g, "");
  return `https://wa.me/${d.length <= 11 ? "55" + d : d}`;
};

/** Master panel: every registered user's contact data, with single/bulk email and WhatsApp. */
export function RegisteredContactsPanel() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [targets, setTargets] = useState<string[] | null>(null);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-registered-contacts"],
    queryFn: async (): Promise<ContactRow[]> => {
      const { data, error } = await supabase.from("profiles")
        .select("user_id, full_name, email, phone, created_at").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ContactRow[];
    },
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return data;
    return data.filter((c) => [c.full_name, c.email, c.phone].some((v) => v?.toLowerCase().includes(q)));
  }, [data, search]);

  const allSelected = filtered.length > 0 && filtered.every((c) => selected.has(c.user_id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(filtered.map((c) => c.user_id)));
  const toggle = (id: string) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const exportCsv = () => {
    const rows = [["Nome", "E-mail", "WhatsApp", "Cadastro"], ...filtered.map((c) => [c.full_name ?? "", c.email ?? "", c.phone ?? "", new Date(c.created_at).toLocaleDateString("pt-BR")])];
    const csv = rows.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(";")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv" }));
    a.download = "cadastros-outapp.csv"; a.click();
  };

  const send = async () => {
    if (!targets?.length || !subject.trim() || !message.trim()) return toast.error("Preencha assunto e mensagem");
    setSending(true);
    const { data: res, error } = await supabase.functions.invoke("admin-broadcast-email", { body: { userIds: targets, subject, message } });
    setSending(false);
    if (error || res?.error) return toast.error(res?.error ?? "Falha ao enviar");
    toast.success(`${res.sent} e-mail(s) enviado(s)${res.failed?.length ? `, ${res.failed.length} falharam` : ""}`);
    setTargets(null); setSubject(""); setMessage("");
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Contatos cadastrados</h2>
        <p className="text-sm text-muted-foreground">{data.length} cadastros salvos — envie e-mails individuais ou em massa e fale pelo WhatsApp.</p>
      </div>
      <div className="flex flex-col gap-2 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar por nome, e-mail ou WhatsApp" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button disabled={selected.size === 0} onClick={() => setTargets([...selected])}><Send className="mr-2 h-4 w-4" />E-mail em massa ({selected.size})</Button>
        <Button variant="outline" onClick={exportCsv}><Download className="mr-2 h-4 w-4" />Exportar</Button>
      </div>
      <Card className="overflow-x-auto">
        {isLoading ? <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div> : (
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-muted-foreground">
              <tr>
                <th className="p-3"><Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="Selecionar todos" /></th>
                <th className="p-3">Nome</th><th className="p-3">E-mail</th><th className="p-3">WhatsApp</th><th className="p-3">Cadastro</th><th className="p-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.user_id} className="border-b border-border last:border-0">
                  <td className="p-3"><Checkbox checked={selected.has(c.user_id)} onCheckedChange={() => toggle(c.user_id)} aria-label={`Selecionar ${c.full_name ?? c.email}`} /></td>
                  <td className="p-3 font-medium text-foreground">{c.full_name || "—"}</td>
                  <td className="p-3 text-muted-foreground">{c.email || "—"}</td>
                  <td className="p-3 text-muted-foreground">{c.phone || "—"}</td>
                  <td className="p-3 text-muted-foreground">{new Date(c.created_at).toLocaleDateString("pt-BR")}</td>
                  <td className="p-3">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" disabled={!c.email} onClick={() => setTargets([c.user_id])} aria-label="Enviar e-mail"><Mail className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" disabled={!c.phone} asChild={!!c.phone} aria-label="Falar no WhatsApp">
                        {c.phone ? <a href={waLink(c.phone)} target="_blank" rel="noopener noreferrer"><MessageCircle className="h-4 w-4 text-primary" /></a> : <MessageCircle className="h-4 w-4" />}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Nenhum cadastro encontrado</td></tr>}
            </tbody>
          </table>
        )}
      </Card>

      <Dialog open={!!targets} onOpenChange={(o) => !o && setTargets(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Enviar e-mail para {targets?.length} contato(s)</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Assunto (ex.: Promoção especial Out App)" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={200} />
            <Textarea rows={8} placeholder="Mensagem... Use {nome} para inserir o primeiro nome." value={message} onChange={(e) => setMessage(e.target.value)} maxLength={10000} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTargets(null)}>Cancelar</Button>
            <Button onClick={send} disabled={sending}>{sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}Enviar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
