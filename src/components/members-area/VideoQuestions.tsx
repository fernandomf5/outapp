import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { MessageCircle, Send, CheckCircle2, Pencil, Trash2, X, Check } from "lucide-react";

interface Question {
  id: string;
  question: string;
  answer: string | null;
  answered_at: string | null;
  created_at: string;
  student_name: string;
}

interface VideoQuestionsProps {
  areaId: string;
  ownerUserId: string;
  blockId: string;
  videoIndex: number;
  accessCodeId: string;
  studentName: string;
  accentColor?: string;
  cardTextColor?: string;
}

export function VideoQuestions({
  areaId,
  ownerUserId,
  blockId,
  videoIndex,
  accessCodeId,
  studentName,
  accentColor = "#8B5CF6",
  cardTextColor = "#374151",
}: VideoQuestionsProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const load = async () => {
    const { data } = await supabase
      .from("members_area_video_questions" as any)
      .select("*")
      .eq("area_id", areaId)
      .eq("block_id", blockId)
      .eq("video_index", videoIndex)
      .eq("access_code_id", accessCodeId)
      .order("created_at", { ascending: true });
    setQuestions((data as any) || []);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`mavq-${blockId}-${videoIndex}-${accessCodeId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "members_area_video_questions",
          filter: `access_code_id=eq.${accessCodeId}`,
        },
        () => load()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areaId, blockId, videoIndex, accessCodeId]);

  const submit = async () => {
    if (!text.trim()) return;
    setLoading(true);
    const { error } = await supabase.from("members_area_video_questions" as any).insert({
      area_id: areaId,
      owner_user_id: ownerUserId,
      access_code_id: accessCodeId,
      student_name: studentName || "Aluno",
      block_id: blockId,
      video_index: videoIndex,
      question: text.trim(),
    });
    setLoading(false);
    if (error) {
      toast.error("Erro ao enviar dúvida");
      return;
    }
    setText("");
    toast.success("Dúvida enviada!");
  };

  return (
    <div
      className="mt-4 rounded-lg border p-4"
      style={{ borderColor: `${accentColor}33`, color: cardTextColor }}
    >
      <div className="flex items-center gap-2 mb-3">
        <MessageCircle className="w-4 h-4" style={{ color: accentColor }} />
        <span className="font-semibold text-sm">Tire suas dúvidas com o professor</span>
      </div>

      {questions.length > 0 && (
        <div className="space-y-3 mb-3 max-h-72 overflow-y-auto">
          {questions.map((q) => (
            <div key={q.id} className="rounded-md bg-black/5 p-3 text-sm">
              <p className="whitespace-pre-wrap">
                <span className="font-medium">Você:</span> {q.question}
              </p>
              {q.answer ? (
                <div className="mt-2 pt-2 border-t border-black/10">
                  <p className="whitespace-pre-wrap flex items-start gap-1">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" style={{ color: accentColor }} />
                    <span>
                      <span className="font-medium" style={{ color: accentColor }}>Professor:</span> {q.answer}
                    </span>
                  </p>
                </div>
              ) : (
                <p className="mt-1 text-xs opacity-70">Aguardando resposta do professor...</p>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escreva sua dúvida..."
          rows={2}
          className="flex-1"
        />
        <Button
          onClick={submit}
          disabled={loading || !text.trim()}
          style={{ backgroundColor: accentColor }}
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
