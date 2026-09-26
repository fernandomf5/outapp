import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Bot, Loader2, Send, UserRound } from "lucide-react";
import { waManage, type WaConnection, type WaConversation, type WaMessage } from "./types";

const MODE_LABEL: Record<string, string> = { ai: "IA", human: "Humano", closed: "Encerrada" };

export function ConversationsView({ connection }: { connection: WaConnection }) {
  const { toast } = useToast();
  const [convs, setConvs] = useState<WaConversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<WaMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const active = convs.find((c) => c.id === activeId) ?? null;

  useEffect(() => {
    const load = () => supabase.from("whatsapp_ai_conversations").select("*").eq("connection_id", connection.id)
      .order("last_message_at", { ascending: false }).then(({ data }) => setConvs(data ?? []));
    load();
    const ch = supabase.channel(`wa-convs-${connection.id}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "whatsapp_ai_conversations", filter: `connection_id=eq.${connection.id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [connection.id]);

  useEffect(() => {
    if (!activeId) return;
    setMsgs([]);
    supabase.from("whatsapp_ai_messages").select("*").eq("conversation_id", activeId).order("created_at")
      .then(({ data }) => setMsgs(data ?? []));
    supabase.from("whatsapp_ai_conversations").update({ unread_count: 0 }).eq("id", activeId).then(() => undefined);
    const ch = supabase.channel(`wa-msgs-${activeId}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "whatsapp_ai_messages", filter: `conversation_id=eq.${activeId}` },
        (p) => setMsgs((m) => (m.some((x) => x.id === (p.new as WaMessage).id) ? m : [...m, p.new as WaMessage])))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [activeId]);

  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [msgs.length]);

  const setMode = async (mode: string) => {
    if (!active) return;
    const { error } = await supabase.from("whatsapp_ai_conversations").update({ mode }).eq("id", active.id);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
  };
  const send = async () => {
    const t = text.trim();
    if (!t || !active) return;
    setSending(true);
    try { await waManage({ action: "send_message", conversationId: active.id, text: t }); setText(""); }
    catch (e) { toast({ title: "Não foi possível enviar", description: (e as Error).message, variant: "destructive" }); }
    finally { setSending(false); }
  };

  return (
    <Card className="grid h-[70vh] min-h-[420px] grid-cols-1 overflow-hidden md:grid-cols-[280px_1fr]">
      <aside className={cn("overflow-y-auto border-border md:border-r", active && "hidden md:block")}>
        {convs.length === 0 && <p className="p-4 text-sm text-muted-foreground">Nenhuma conversa ainda. Elas aparecem aqui quando alguém enviar mensagem.</p>}
        {convs.map((c) => (
          <button key={c.id} onClick={() => setActiveId(c.id)} className={cn("flex w-full flex-col gap-0.5 border-b border-border px-3 py-2.5 text-left hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", c.id === activeId && "bg-muted")}>
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-sm font-medium">{c.contact_name || `+${c.contact_phone}`}</span>
              {c.unread_count > 0 && <Badge className="h-5 px-1.5">{c.unread_count}</Badge>}
            </div>
            <div className="flex items-center gap-2">
              <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{c.last_message_preview}</span>
              <span className="text-[10px] uppercase text-muted-foreground">{MODE_LABEL[c.mode]}</span>
            </div>
          </button>
        ))}
      </aside>

      <section className={cn("flex min-h-0 flex-col", !active && "hidden md:flex")}>
        {!active ? <p className="m-auto text-sm text-muted-foreground">Selecione uma conversa</p> : (<>
          <header className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2">
            <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setActiveId(null)}>Voltar</Button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{active.contact_name || `+${active.contact_phone}`}</p>
              <p className="text-xs text-muted-foreground">+{active.contact_phone} · {MODE_LABEL[active.mode]}</p>
            </div>
            {active.mode !== "ai" && <Button size="sm" variant="outline" onClick={() => setMode("ai")}><Bot className="mr-1 h-4 w-4" />Devolver à IA</Button>}
            {active.mode === "ai" && <Button size="sm" variant="outline" onClick={() => setMode("human")}><UserRound className="mr-1 h-4 w-4" />Assumir</Button>}
            {active.mode !== "closed" && <Button size="sm" variant="ghost" onClick={() => setMode("closed")}>Encerrar</Button>}
          </header>
          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            {msgs.map((m) => (
              <div key={m.id} className={cn("flex", m.direction === "out" ? "justify-end" : "justify-start")}>
                <div className={cn("max-w-[80%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm",
                  m.direction === "in" ? "bg-muted text-foreground" : m.sender === "system" ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground")}>
                  {m.direction === "out" && <span className="mb-0.5 block text-[10px] uppercase opacity-70">{m.sender === "ai" ? "IA" : m.sender === "human" ? "Você" : "Sistema"}</span>}
                  {m.content}
                  <span className="mt-0.5 block text-right text-[10px] opacity-60">{new Date(m.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>
          <div className="flex items-end gap-2 border-t border-border p-2">
            <Textarea rows={2} value={text} placeholder="Responder como atendente..." className="min-h-0 flex-1 resize-none"
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} />
            <Button size="icon" onClick={send} disabled={sending || !text.trim()} aria-label="Enviar">{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</Button>
          </div>
        </>)}
      </section>
    </Card>
  );
}
