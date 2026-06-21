import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, Copy, ExternalLink, Pencil, GripVertical, Eye, ClipboardCheck, BarChart3 } from "lucide-react";

type OptionItem = { id: string; text: string; offer_ids: string[] };
type Question = {
  id: string;
  type: "choice" | "text";
  text: string;
  required: boolean;
  options: OptionItem[]; // for choice
};
type Offer = {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  button_text: string;
  button_url: string;
};
type Questionnaire = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  cover_image?: string | null;
  primary_color: string;
  questions: Question[];
  offers: Offer[];
  capture_lead: boolean;
  capture_fields: string[];
  send_to_crm: boolean;
  thank_you_title: string;
  thank_you_description: string;
  is_active: boolean;
  total_responses: number;
};

const uid = () => Math.random().toString(36).slice(2, 10);

const blank = (): Partial<Questionnaire> => ({
  title: "Novo Questionário",
  description: "",
  primary_color: "#6366f1",
  questions: [],
  offers: [],
  capture_lead: true,
  capture_fields: ["name", "email", "phone"],
  send_to_crm: true,
  thank_you_title: "Obrigado!",
  thank_you_description: "Confira o que separamos para você:",
  is_active: true,
});

export function MarketingQuestionnairePanel() {
  const [list, setList] = useState<Questionnaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Questionnaire | null>(null);
  const [responses, setResponses] = useState<any[] | null>(null);
  const [showResponsesFor, setShowResponsesFor] = useState<Questionnaire | null>(null);

  const load = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await (supabase as any)
      .from("marketing_questionnaires")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setList((data || []) as Questionnaire[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const createNew = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await (supabase as any)
      .from("marketing_questionnaires")
      .insert({ ...blank(), user_id: user.id })
      .select()
      .single();
    if (error) return toast.error(error.message);
    await load();
    setEditing(data as Questionnaire);
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir este questionário?")) return;
    const { error } = await (supabase as any).from("marketing_questionnaires").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Removido");
    load();
  };

  const toggleActive = async (q: Questionnaire) => {
    await (supabase as any).from("marketing_questionnaires").update({ is_active: !q.is_active }).eq("id", q.id);
    load();
  };

  const copyLink = (id: string) => {
    const url = `${window.location.origin}/q/${id}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copiado!");
  };

  const loadResponses = async (q: Questionnaire) => {
    setShowResponsesFor(q);
    const { data } = await (supabase as any)
      .from("marketing_questionnaire_responses")
      .select("*")
      .eq("questionnaire_id", q.id)
      .order("created_at", { ascending: false });
    setResponses(data || []);
  };

  if (editing) {
    return <Editor q={editing} onClose={() => { setEditing(null); load(); }} />;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><ClipboardCheck className="w-5 h-5" />Questionário Marketing</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Crie questionários simples e direcione ofertas com base nas respostas.</p>
          </div>
          <Button onClick={createNew}><Plus className="w-4 h-4 mr-1" />Novo Questionário</Button>
        </CardHeader>
      </Card>

      {loading ? (
        <div className="text-center py-10 text-muted-foreground">Carregando...</div>
      ) : list.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">
          Nenhum questionário criado ainda. Clique em "Novo Questionário" para começar.
        </CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {list.map((q) => (
            <Card key={q.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{q.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">{q.description || "Sem descrição"}</p>
                  </div>
                  <Badge variant={q.is_active ? "default" : "secondary"}>{q.is_active ? "Ativo" : "Inativo"}</Badge>
                </div>
                <div className="flex gap-2 text-xs text-muted-foreground">
                  <span>{q.questions?.length || 0} perguntas</span>
                  <span>•</span>
                  <span>{q.offers?.length || 0} ofertas</span>
                  <span>•</span>
                  <span>{q.total_responses || 0} respostas</span>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t">
                  <Switch checked={q.is_active} onCheckedChange={() => toggleActive(q)} />
                  <span className="text-xs">Ativo</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditing(q)}><Pencil className="w-3 h-3 mr-1" />Editar</Button>
                  <Button size="sm" variant="outline" onClick={() => copyLink(q.id)}><Copy className="w-3 h-3 mr-1" />Link</Button>
                  <Button size="sm" variant="outline" onClick={() => window.open(`/q/${q.id}`, "_blank")}><ExternalLink className="w-3 h-3 mr-1" />Abrir</Button>
                  <Button size="sm" variant="outline" onClick={() => loadResponses(q)}><BarChart3 className="w-3 h-3 mr-1" />Respostas</Button>
                </div>
                <Button size="sm" variant="ghost" className="w-full text-destructive" onClick={() => remove(q.id)}>
                  <Trash2 className="w-3 h-3 mr-1" />Excluir
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!showResponsesFor} onOpenChange={(o) => { if (!o) { setShowResponsesFor(null); setResponses(null); }}}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Respostas: {showResponsesFor?.title}</DialogTitle></DialogHeader>
          {responses === null ? <div>Carregando...</div> :
           responses.length === 0 ? <div className="text-muted-foreground text-center py-6">Nenhuma resposta ainda.</div> :
           <div className="space-y-3">
             {responses.map((r) => (
               <Card key={r.id}><CardContent className="p-3 text-sm space-y-1">
                 <div className="flex justify-between">
                   <strong>{r.name || "Anônimo"}</strong>
                   <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString("pt-BR")}</span>
                 </div>
                 <div className="text-xs text-muted-foreground">{r.email} {r.phone && ` · ${r.phone}`}</div>
                 <details className="text-xs mt-2">
                   <summary className="cursor-pointer text-primary">Ver respostas</summary>
                   <pre className="mt-2 p-2 bg-muted rounded overflow-x-auto">{JSON.stringify(r.answers, null, 2)}</pre>
                 </details>
               </CardContent></Card>
             ))}
           </div>}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// =================== EDITOR ===================
function Editor({ q, onClose }: { q: Questionnaire; onClose: () => void }) {
  const [data, setData] = useState<Questionnaire>({
    ...q,
    questions: Array.isArray(q.questions) ? q.questions : [],
    offers: Array.isArray(q.offers) ? q.offers : [],
    capture_fields: Array.isArray(q.capture_fields) ? q.capture_fields : ["name", "email", "phone"],
  });
  const [saving, setSaving] = useState(false);

  const update = <K extends keyof Questionnaire>(key: K, value: Questionnaire[K]) => setData((d) => ({ ...d, [key]: value }));

  const save = async () => {
    setSaving(true);
    const { error } = await (supabase as any)
      .from("marketing_questionnaires")
      .update({
        title: data.title,
        description: data.description,
        cover_image: data.cover_image,
        primary_color: data.primary_color,
        questions: data.questions,
        offers: data.offers,
        capture_lead: data.capture_lead,
        capture_fields: data.capture_fields,
        send_to_crm: data.send_to_crm,
        thank_you_title: data.thank_you_title,
        thank_you_description: data.thank_you_description,
        is_active: data.is_active,
      })
      .eq("id", data.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Salvo!");
  };

  // Questions
  const addQuestion = (type: "choice" | "text") => {
    update("questions", [...data.questions, {
      id: uid(), type, text: "Nova pergunta", required: true,
      options: type === "choice" ? [{ id: uid(), text: "Opção 1", offer_ids: [] }] : [],
    }]);
  };
  const updateQuestion = (id: string, patch: Partial<Question>) =>
    update("questions", data.questions.map((qq) => qq.id === id ? { ...qq, ...patch } : qq));
  const removeQuestion = (id: string) => update("questions", data.questions.filter((qq) => qq.id !== id));
  const addOption = (qid: string) => {
    const q = data.questions.find((x) => x.id === qid)!;
    updateQuestion(qid, { options: [...q.options, { id: uid(), text: `Opção ${q.options.length + 1}`, offer_ids: [] }] });
  };
  const updateOption = (qid: string, oid: string, patch: Partial<OptionItem>) => {
    const q = data.questions.find((x) => x.id === qid)!;
    updateQuestion(qid, { options: q.options.map((o) => o.id === oid ? { ...o, ...patch } : o) });
  };
  const removeOption = (qid: string, oid: string) => {
    const q = data.questions.find((x) => x.id === qid)!;
    updateQuestion(qid, { options: q.options.filter((o) => o.id !== oid) });
  };

  // Offers
  const addOffer = () => update("offers", [...data.offers, {
    id: uid(), title: "Nova oferta", description: "", button_text: "Saiba mais", button_url: "",
  }]);
  const updateOffer = (id: string, patch: Partial<Offer>) =>
    update("offers", data.offers.map((o) => o.id === id ? { ...o, ...patch } : o));
  const removeOffer = (id: string) => {
    update("offers", data.offers.filter((o) => o.id !== id));
    // also unlink
    update("questions", data.questions.map((q) => ({
      ...q,
      options: q.options.map((op) => ({ ...op, offer_ids: op.offer_ids.filter((x) => x !== id) })),
    })));
  };

  const toggleOptionOffer = (qid: string, oid: string, offerId: string) => {
    const q = data.questions.find((x) => x.id === qid)!;
    const opt = q.options.find((o) => o.id === oid)!;
    const has = opt.offer_ids.includes(offerId);
    updateOption(qid, oid, { offer_ids: has ? opt.offer_ids.filter((x) => x !== offerId) : [...opt.offer_ids, offerId] });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>← Voltar</Button>
            <CardTitle className="text-lg">Editar Questionário</CardTitle>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => window.open(`/q/${data.id}`, "_blank")}>
              <Eye className="w-4 h-4 mr-1" />Visualizar
            </Button>
            <Button size="sm" onClick={save} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="content">
        <TabsList>
          <TabsTrigger value="content">Conteúdo</TabsTrigger>
          <TabsTrigger value="questions">Perguntas ({data.questions.length})</TabsTrigger>
          <TabsTrigger value="offers">Ofertas ({data.offers.length})</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-3">
          <Card><CardContent className="pt-6 space-y-3">
            <div><Label>Título</Label><Input value={data.title} onChange={(e) => update("title", e.target.value)} /></div>
            <div><Label>Descrição</Label><Textarea value={data.description} onChange={(e) => update("description", e.target.value)} /></div>
            <div><Label>Imagem de capa (URL)</Label><Input value={data.cover_image || ""} onChange={(e) => update("cover_image", e.target.value)} placeholder="https://..." /></div>
            <div><Label>Cor primária</Label><Input type="color" value={data.primary_color} onChange={(e) => update("primary_color", e.target.value)} className="h-10 w-24" /></div>
            <div><Label>Título da tela final</Label><Input value={data.thank_you_title} onChange={(e) => update("thank_you_title", e.target.value)} /></div>
            <div><Label>Descrição da tela final</Label><Textarea value={data.thank_you_description} onChange={(e) => update("thank_you_description", e.target.value)} /></div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="questions" className="space-y-3">
          <div className="flex gap-2">
            <Button size="sm" onClick={() => addQuestion("choice")}><Plus className="w-4 h-4 mr-1" />Múltipla escolha</Button>
            <Button size="sm" variant="outline" onClick={() => addQuestion("text")}><Plus className="w-4 h-4 mr-1" />Resposta escrita</Button>
          </div>
          {data.questions.length === 0 && <Card><CardContent className="py-8 text-center text-muted-foreground">Adicione sua primeira pergunta.</CardContent></Card>}
          {data.questions.map((qq, idx) => (
            <Card key={qq.id}>
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center gap-2">
                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                  <Badge>Pergunta {idx + 1}</Badge>
                  <Badge variant="outline">{qq.type === "choice" ? "Múltipla escolha" : "Resposta escrita"}</Badge>
                  <div className="flex-1" />
                  <div className="flex items-center gap-2 text-xs">
                    <Switch checked={qq.required} onCheckedChange={(v) => updateQuestion(qq.id, { required: v })} /> Obrigatória
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => removeQuestion(qq.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
                <Input value={qq.text} onChange={(e) => updateQuestion(qq.id, { text: e.target.value })} placeholder="Texto da pergunta" />
                {qq.type === "choice" && (
                  <div className="space-y-2 pl-4 border-l-2">
                    {qq.options.map((opt) => (
                      <div key={opt.id} className="space-y-1 p-2 rounded border">
                        <div className="flex gap-2 items-center">
                          <Input value={opt.text} onChange={(e) => updateOption(qq.id, opt.id, { text: e.target.value })} placeholder="Texto da opção" />
                          <Button size="icon" variant="ghost" onClick={() => removeOption(qq.id, opt.id)}><Trash2 className="w-3 h-3 text-destructive" /></Button>
                        </div>
                        <div className="pl-2">
                          <Label className="text-xs text-muted-foreground">Ofertas a mostrar quando essa opção for escolhida:</Label>
                          {data.offers.length === 0 ? (
                            <p className="text-xs italic text-muted-foreground">Crie ofertas na aba "Ofertas" para vincular aqui.</p>
                          ) : (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {data.offers.map((of) => (
                                <Badge key={of.id} variant={opt.offer_ids.includes(of.id) ? "default" : "outline"}
                                       className="cursor-pointer"
                                       onClick={() => toggleOptionOffer(qq.id, opt.id, of.id)}>
                                  {opt.offer_ids.includes(of.id) ? "✓ " : ""}{of.title}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    <Button size="sm" variant="outline" onClick={() => addOption(qq.id)}><Plus className="w-3 h-3 mr-1" />Opção</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="offers" className="space-y-3">
          <Button size="sm" onClick={addOffer}><Plus className="w-4 h-4 mr-1" />Nova oferta</Button>
          {data.offers.length === 0 && <Card><CardContent className="py-8 text-center text-muted-foreground">Crie ofertas para vincular às respostas.</CardContent></Card>}
          {data.offers.map((of) => (
            <Card key={of.id}><CardContent className="pt-6 space-y-2">
              <div className="flex justify-between items-center">
                <Badge>Oferta</Badge>
                <Button size="icon" variant="ghost" onClick={() => removeOffer(of.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
              </div>
              <Input value={of.title} onChange={(e) => updateOffer(of.id, { title: e.target.value })} placeholder="Título" />
              <Textarea value={of.description} onChange={(e) => updateOffer(of.id, { description: e.target.value })} placeholder="Descrição" />
              <Input value={of.image_url || ""} onChange={(e) => updateOffer(of.id, { image_url: e.target.value })} placeholder="URL da imagem (opcional)" />
              <div className="grid grid-cols-2 gap-2">
                <Input value={of.button_text} onChange={(e) => updateOffer(of.id, { button_text: e.target.value })} placeholder="Texto do botão" />
                <Input value={of.button_url} onChange={(e) => updateOffer(of.id, { button_url: e.target.value })} placeholder="URL do botão" />
              </div>
            </CardContent></Card>
          ))}
        </TabsContent>

        <TabsContent value="settings" className="space-y-3">
          <Card><CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div><Label>Ativo</Label><p className="text-xs text-muted-foreground">Pessoas só podem responder se estiver ativo.</p></div>
              <Switch checked={data.is_active} onCheckedChange={(v) => update("is_active", v)} />
            </div>
            <div className="flex items-center justify-between">
              <div><Label>Capturar lead antes do questionário</Label><p className="text-xs text-muted-foreground">Pede nome/e-mail/telefone antes de iniciar.</p></div>
              <Switch checked={data.capture_lead} onCheckedChange={(v) => update("capture_lead", v)} />
            </div>
            {data.capture_lead && (
              <div className="pl-4 space-y-2">
                <Label className="text-xs">Campos a capturar:</Label>
                {(["name", "email", "phone"] as const).map((f) => (
                  <div key={f} className="flex items-center gap-2">
                    <Switch checked={data.capture_fields.includes(f)} onCheckedChange={(v) => {
                      update("capture_fields", v ? [...data.capture_fields, f] : data.capture_fields.filter((x) => x !== f));
                    }} />
                    <span className="text-sm capitalize">{f === "name" ? "Nome" : f === "email" ? "E-mail" : "Telefone"}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between">
              <div><Label>Enviar lead para o Controle de Leads (CRM)</Label></div>
              <Switch checked={data.send_to_crm} onCheckedChange={(v) => update("send_to_crm", v)} />
            </div>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
