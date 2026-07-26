import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Mail, Phone, Trash2, CheckCheck, Search, Inbox, Send } from "lucide-react";
import { toast } from "sonner";

interface Submission {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  is_read: boolean | null;
  replied_at: string | null;
  created_at: string | null;
}

interface Props {
  agentId: string;
}

export default function AgentContactFormsPanel({ agentId }: Props) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Submission[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Submission | null>(null);
  const [replySubject, setReplySubject] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("contact_form_submissions")
      .select("id, name, email, phone, subject, message, is_read, replied_at, created_at")
      .eq("agent_id", agentId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      toast.error("Erro ao carregar mensagens do formulário");
    } else {
      setItems((data || []) as Submission[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!agentId) return;
    load();

    const channel = supabase
      .channel(`contact-forms-${agentId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "contact_form_submissions" },
        () => load()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId]);

  const openConversation = async (item: Submission) => {
    setSelected(item);
    setReplySubject(item.subject ? `Re: ${item.subject}` : `Re: sua mensagem no chat online`);
    setReplyBody(`Olá ${item.name},\n\n`);

    if (!item.is_read) {
      await supabase
        .from("contact_form_submissions")
        .update({ is_read: true })
        .eq("id", item.id);
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, is_read: true } : i))
      );
    }
  };

  const sendByEmail = async () => {
    if (!selected) return;
    const url = `mailto:${encodeURIComponent(selected.email)}?subject=${encodeURIComponent(
      replySubject
    )}&body=${encodeURIComponent(replyBody)}`;
    window.open(url, "_blank");

    await supabase
      .from("contact_form_submissions")
      .update({ replied_at: new Date().toISOString(), is_read: true })
      .eq("id", selected.id);

    setItems((prev) =>
      prev.map((i) =>
        i.id === selected.id
          ? { ...i, replied_at: new Date().toISOString(), is_read: true }
          : i
      )
    );
    toast.success("Abrindo seu e-mail para responder o cliente");
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase
      .from("contact_form_submissions")
      .delete()
      .eq("id", deleteId);
    if (error) {
      toast.error("Não foi possível excluir");
    } else {
      setItems((prev) => prev.filter((i) => i.id !== deleteId));
      if (selected?.id === deleteId) setSelected(null);
      toast.success("Mensagem excluída");
    }
    setDeleteId(null);
  };

  const filtered = items.filter((i) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      i.name.toLowerCase().includes(q) ||
      i.email.toLowerCase().includes(q) ||
      i.message.toLowerCase().includes(q)
    );
  });

  const unread = items.filter((i) => !i.is_read).length;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Inbox className="w-5 h-5 text-primary" />
              Mensagens do formulário
              {unread > 0 && <Badge variant="destructive">{unread} nova(s)</Badge>}
            </CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome, e-mail ou texto"
                className="pl-9"
                maxLength={100}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <Skeleton key={n} className="h-20 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Inbox className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">
                Nenhuma mensagem enviada pelo formulário do chat ainda.
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[60vh] pr-2">
              <div className="space-y-3">
                {filtered.map((item) => (
                  <div
                    key={item.id}
                    className={`rounded-xl border p-4 transition-colors cursor-pointer hover:bg-accent/50 ${
                      !item.is_read ? "border-primary/40 bg-primary/5" : ""
                    }`}
                    onClick={() => openConversation(item)}
                  >
                    <div className="flex flex-wrap items-center gap-2 justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-semibold truncate">{item.name}</span>
                        {!item.is_read && <Badge variant="destructive">Nova</Badge>}
                        {item.replied_at && (
                          <Badge variant="secondary" className="gap-1">
                            <CheckCheck className="w-3 h-3" /> Respondida
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {item.created_at
                          ? new Date(item.created_at).toLocaleString("pt-BR")
                          : ""}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {item.email}
                      </span>
                      {item.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {item.phone}
                        </span>
                      )}
                    </div>
                    {item.subject && (
                      <p className="mt-2 text-sm font-medium truncate">{item.subject}</p>
                    )}
                    <p className="mt-1 text-sm line-clamp-2 whitespace-pre-wrap">
                      {item.message}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          openConversation(item);
                        }}
                      >
                        <Send className="w-3.5 h-3.5 mr-1" /> Responder por e-mail
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteId(item.id);
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Conversa com {selected?.name}</DialogTitle>
            <DialogDescription>{selected?.email}</DialogDescription>
          </DialogHeader>

          {selected && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-3 text-sm whitespace-pre-wrap max-h-40 overflow-y-auto">
                {selected.message}
              </div>
              <div className="space-y-2">
                <Input
                  value={replySubject}
                  onChange={(e) => setReplySubject(e.target.value)}
                  placeholder="Assunto"
                  maxLength={150}
                />
                <Textarea
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  rows={7}
                  placeholder="Escreva sua resposta..."
                  maxLength={3000}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>
              Fechar
            </Button>
            <Button onClick={sendByEmail} disabled={!replyBody.trim()}>
              <Mail className="w-4 h-4 mr-2" /> Enviar por e-mail
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir mensagem?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
