import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, Trash2, MailOpen, Inbox } from "lucide-react";
import { toast } from "sonner";

interface MessageRow {
  id: string;
  portfolio_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  subject: string | null;
  message: string;
  is_read: boolean | null;
  created_at: string;
}

const db = supabase as any;

export const PortfolioMessagesPanel = ({ portfolios }: { portfolios: { id: string; name: string }[] }) => {
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return setLoading(false);
    const { data, error } = await db
      .from("portfolio_messages")
      .select("*")
      .eq("user_id", auth.user.id)
      .order("created_at", { ascending: false });
    if (error) toast.error("Erro ao carregar mensagens");
    setMessages(data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const toggleRead = async (m: MessageRow) => {
    await db.from("portfolio_messages").update({ is_read: !m.is_read }).eq("id", m.id);
    setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, is_read: !m.is_read } : x)));
  };

  const remove = async (m: MessageRow) => {
    const { error } = await db.from("portfolio_messages").delete().eq("id", m.id);
    if (error) return toast.error(error.message);
    setMessages((prev) => prev.filter((x) => x.id !== m.id));
    toast.success("Mensagem excluída");
  };

  const portfolioName = (id: string) => portfolios.find((p) => p.id === id)?.name || "Portfólio";

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <Card className="p-10 text-center">
        <Inbox className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
        <p className="font-medium">Nenhuma mensagem recebida</p>
        <p className="text-sm text-muted-foreground">As mensagens enviadas pelo formulário do portfólio aparecem aqui.</p>
      </Card>
    );
  }

  const unread = messages.filter((m) => !m.is_read).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Mail className="h-4 w-4" />
        {messages.length} mensagem{messages.length === 1 ? "" : "s"}
        {unread > 0 ? <Badge className="ml-1">{unread} não lida{unread === 1 ? "" : "s"}</Badge> : null}
      </div>
      {messages.map((m) => (
        <Card key={m.id} className={`p-4 ${m.is_read ? "" : "border-primary/40 bg-primary/5"}`}>
          <div className="flex flex-wrap items-start gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{m.name}</span>
                <Badge variant="secondary" className="text-[10px]">{portfolioName(m.portfolio_id)}</Badge>
                <span className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString("pt-BR")}</span>
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {[m.email, m.phone].filter(Boolean).join(" • ")}
              </div>
              {m.subject ? <p className="mt-2 text-sm font-medium">{m.subject}</p> : null}
              <p className="mt-1 whitespace-pre-wrap text-sm">{m.message}</p>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title={m.is_read ? "Marcar como não lida" : "Marcar como lida"} onClick={() => toggleRead(m)}>
                <MailOpen className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => remove(m)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default PortfolioMessagesPanel;
