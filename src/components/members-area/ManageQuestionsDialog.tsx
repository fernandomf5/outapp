import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { toast } from "sonner";
import { MessageCircle, Trash2, Send, CheckCircle2 } from "lucide-react";

interface Question {
  id: string;
  area_id: string;
  access_code_id: string | null;
  student_name: string;
  block_id: string;
  video_index: number;
  question: string;
  answer: string | null;
  answered_at: string | null;
  created_at: string;
}

interface ManageQuestionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  areaId: string;
  areaName: string;
}

export function ManageQuestionsDialog({ open, onOpenChange, areaId, areaName }: ManageQuestionsDialogProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [toDelete, setToDelete] = useState<Question | null>(null);

  const load = async () => {
    const { data } = await supabase
      .from("members_area_video_questions" as any)
      .select("*")
      .eq("area_id", areaId)
      .order("created_at", { ascending: false });
    setQuestions((data as any) || []);
  };

  useEffect(() => {
    if (!open) return;
    load();
    const channel = supabase
      .channel(`mavq-manage-${areaId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "members_area_video_questions", filter: `area_id=eq.${areaId}` },
        () => load()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, areaId]);

  const handleAnswer = async (q: Question) => {
    const ans = (answers[q.id] ?? q.answer ?? "").trim();
    if (!ans) return;
    setLoading(true);
    const { error } = await supabase
      .from("members_area_video_questions" as any)
      .update({ answer: ans, answered_at: new Date().toISOString() })
      .eq("id", q.id);
    setLoading(false);
    if (error) return toast.error("Erro ao responder");
    toast.success("Resposta enviada!");
    setAnswers((a) => ({ ...a, [q.id]: "" }));
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    const { error } = await supabase
      .from("members_area_video_questions" as any)
      .delete()
      .eq("id", toDelete.id);
    if (error) return toast.error("Erro ao excluir");
    toast.success("Dúvida excluída");
    setToDelete(null);
  };

  const pending = questions.filter((q) => !q.answer).length;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Dúvidas dos alunos — {areaName}
              {pending > 0 && <Badge variant="destructive">{pending} pendentes</Badge>}
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="h-[65vh] pr-4">
            {questions.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">Nenhuma dúvida recebida ainda.</p>
            ) : (
              <div className="space-y-4">
                {questions.map((q) => (
                  <div key={q.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-semibold text-sm">{q.student_name}</span>
                          <Badge variant="outline" className="text-xs">Vídeo #{q.video_index + 1}</Badge>
                          {q.answer ? (
                            <Badge variant="secondary" className="text-xs gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Respondida
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="text-xs">Pendente</Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {new Date(q.created_at).toLocaleString("pt-BR")}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{q.question}</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => setToDelete(q)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>

                    {q.answer && (
                      <div className="bg-muted/50 rounded p-2 text-sm">
                        <span className="font-medium">Sua resposta:</span> {q.answer}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Textarea
                        rows={2}
                        placeholder={q.answer ? "Editar resposta..." : "Escreva sua resposta..."}
                        value={answers[q.id] ?? q.answer ?? ""}
                        onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                      />
                      <Button onClick={() => handleAnswer(q)} disabled={loading}>
                        <Send className="w-4 h-4 mr-1" />
                        {q.answer ? "Atualizar" : "Responder"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        onConfirm={handleDelete}
        title="Excluir dúvida?"
        description="Esta ação não pode ser desfeita."
      />
    </>
  );
}
