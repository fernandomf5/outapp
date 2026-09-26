import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Loader2, MessageCircle, Plus, Trash2 } from "lucide-react";
import { ConnectionSetup } from "./ConnectionSetup";
import { AgentSettings } from "./AgentSettings";
import { ConversationsView } from "./ConversationsView";
import { STATUS_LABEL, type WaConnection } from "./types";

export function WhatsAppAIPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<WaConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [provider, setProvider] = useState<"evolution" | "meta">("evolution");
  const selected = items.find((i) => i.id === selectedId) ?? null;

  useEffect(() => {
    if (!user) return;
    const load = () => supabase.from("whatsapp_ai_connections").select("*").eq("user_id", user.id).order("created_at")
      .then(({ data, error }) => { if (error) toast({ title: "Erro", description: error.message, variant: "destructive" }); setItems(data ?? []); setLoading(false); });
    load();
    const ch = supabase.channel(`wa-conn-${user.id}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "whatsapp_ai_connections", filter: `user_id=eq.${user.id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, toast]);

  const create = async () => {
    if (!user || !name.trim()) return;
    const { data, error } = await supabase.from("whatsapp_ai_connections").insert({ user_id: user.id, name: name.trim().slice(0, 80), provider }).select().single();
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    setItems((l) => [...l, data]); setOpen(false); setName(""); setSelectedId(data.id);
  };
  const remove = async (id: string) => {
    if (!confirm("Excluir esta conexão e todas as conversas?")) return;
    const { error } = await supabase.from("whatsapp_ai_connections").delete().eq("id", id);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    setItems((l) => l.filter((i) => i.id !== id));
  };

  if (selected) return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => setSelectedId(null)}><ArrowLeft className="mr-1 h-4 w-4" />Voltar</Button>
        <h2 className="truncate text-lg font-semibold">{selected.name}</h2>
        <Badge variant={selected.status === "connected" ? "default" : "secondary"}>{STATUS_LABEL[selected.status]}</Badge>
      </div>
      <Tabs defaultValue={selected.status === "connected" ? "conversas" : "conexao"}>
        <TabsList>
          <TabsTrigger value="conexao">Conexão</TabsTrigger>
          <TabsTrigger value="agente">Agente de IA</TabsTrigger>
          <TabsTrigger value="conversas">Conversas</TabsTrigger>
        </TabsList>
        <TabsContent value="conexao"><ConnectionSetup connection={selected} /></TabsContent>
        <TabsContent value="agente"><AgentSettings key={selected.id} connection={selected} /></TabsContent>
        <TabsContent value="conversas"><ConversationsView connection={selected} /></TabsContent>
      </Tabs>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-semibold">WhatsApp com Agente de IA</h2>
          <p className="text-sm text-muted-foreground">Conecte seu WhatsApp e deixe a IA atender, com transferência para você quando precisar.</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" />Nova conexão</Button>
      </div>
      {loading ? <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" /> : items.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Nenhuma conexão ainda. Clique em "Nova conexão" para começar.</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {items.map((i) => (
            <Card key={i.id} className="cursor-pointer transition-colors hover:border-primary" onClick={() => setSelectedId(i.id)}>
              <CardHeader className="flex flex-row items-start gap-3 space-y-0">
                <MessageCircle className="mt-0.5 h-5 w-5 text-primary" />
                <div className="min-w-0 flex-1">
                  <CardTitle className="truncate text-base">{i.name}</CardTitle>
                  <CardDescription>{i.provider === "evolution" ? "QR Code (Evolution)" : "API oficial Meta"}{i.phone_number ? ` · ${i.phone_number}` : ""}</CardDescription>
                </div>
                <Button size="icon" variant="ghost" aria-label="Excluir conexão" onClick={(e) => { e.stopPropagation(); remove(i.id); }}><Trash2 className="h-4 w-4" /></Button>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Badge variant={i.status === "connected" ? "default" : "secondary"}>{STATUS_LABEL[i.status]}</Badge>
                <Badge variant="outline">IA {i.agent_enabled ? "ligada" : "desligada"}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova conexão de WhatsApp</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="wa-name">Nome</Label>
              <Input id="wa-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Atendimento da loja" />
            </div>
            <RadioGroup value={provider} onValueChange={(v) => setProvider(v as "evolution" | "meta")} className="space-y-2">
              {([["evolution", "QR Code (Evolution API)", "Leia o QR Code com o celular. Precisa de um servidor Evolution API."],
                ["meta", "API oficial da Meta", "WhatsApp Business Cloud API. Exige conta Meta Business e token."]] as const).map(([v, l, d]) => (
                <Label key={v} htmlFor={`p-${v}`} className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-3 font-normal">
                  <RadioGroupItem id={`p-${v}`} value={v} className="mt-0.5" />
                  <span><span className="block font-medium">{l}</span><span className="text-xs text-muted-foreground">{d}</span></span>
                </Label>
              ))}
            </RadioGroup>
          </div>
          <DialogFooter><Button onClick={create} disabled={!name.trim()}>Criar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
