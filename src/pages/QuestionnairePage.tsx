import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { ArrowRight, Loader2, CheckCircle2, ExternalLink } from "lucide-react";
import { CountdownTimer } from "@/components/CountdownTimer";

type Option = { id: string; text: string; offer_ids: string[] };
type Question = { id: string; type: "choice" | "text"; text: string; required: boolean; options: Option[] };
type Offer = { id: string; title: string; description: string; image_url?: string; button_text: string; button_url: string };
type Q = {
  id: string; user_id: string; title: string; description: string; cover_image?: string;
  primary_color: string; questions: Question[]; offers: Offer[];
  capture_lead: boolean; capture_fields: string[]; send_to_crm: boolean;
  thank_you_title: string; thank_you_description: string; is_active: boolean;
  button_color?: string; button_text_color?: string; background_color?: string;
  question_color?: string; text_color?: string; button_animation?: string;
  countdown_enabled?: boolean; countdown_ends_at?: string | null;
  countdown_bg_color?: string; countdown_text_color?: string; countdown_label?: string;
};

export default function QuestionnairePage() {
  const { questionnaireId } = useParams();
  const [q, setQ] = useState<Q | null>(null);
  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState<"intro" | "capture" | "questions" | "done">("intro");
  const [lead, setLead] = useState({ name: "", email: "", phone: "" });
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [current, setCurrent] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [matchedOffers, setMatchedOffers] = useState<Offer[]>([]);

  useEffect(() => {
    (async () => {
      const { data, error } = await (supabase as any)
        .from("marketing_questionnaires")
        .select("*")
        .eq("id", questionnaireId)
        .eq("is_active", true)
        .maybeSingle();
      if (error) toast.error(error.message);
      setQ(data as Q);
      setLoading(false);
    })();
  }, [questionnaireId]);

  const start = () => {
    if (q?.capture_lead && q.capture_fields.length > 0) setStage("capture");
    else setStage("questions");
  };

  const submitCapture = () => {
    if (q?.capture_fields.includes("name") && !lead.name.trim()) return toast.error("Informe seu nome");
    if (q?.capture_fields.includes("email") && !lead.email.trim()) return toast.error("Informe seu e-mail");
    if (q?.capture_fields.includes("phone") && !lead.phone.trim()) return toast.error("Informe seu telefone");
    setStage("questions");
  };

  const finishQuestions = async () => {
    if (!q) return;
    setSubmitting(true);
    try {
      // compute matched offers
      const offerSet = new Set<string>();
      q.questions.forEach((qq) => {
        if (qq.type === "choice") {
          const sel = answers[qq.id];
          const opts: string[] = Array.isArray(sel) ? sel : sel ? [sel] : [];
          opts.forEach((oid) => {
            const opt = qq.options.find((o) => o.id === oid);
            opt?.offer_ids.forEach((x) => offerSet.add(x));
          });
        }
      });
      let matched = q.offers.filter((o) => offerSet.has(o.id));
      if (matched.length === 0) matched = q.offers; // fallback: show all

      const answerLog = q.questions.map((qq) => {
        const a = answers[qq.id];
        if (qq.type === "choice") {
          const ids: string[] = Array.isArray(a) ? a : a ? [a] : [];
          return { question: qq.text, type: "choice", answer: ids.map((i) => qq.options.find((o) => o.id === i)?.text).filter(Boolean) };
        }
        return { question: qq.text, type: "text", answer: a || "" };
      });

      const { error } = await (supabase as any).from("marketing_questionnaire_responses").insert({
        questionnaire_id: q.id,
        name: lead.name || null,
        email: lead.email || null,
        phone: lead.phone || null,
        answers: answerLog,
        matched_offer_ids: matched.map((o) => o.id),
      });
      if (error) {
        toast.error(error.message);
        return;
      }

      // Show result immediately — side effects below are best-effort
      setMatchedOffers(matched);
      setStage("done");

      // Fire-and-forget: anon user lacks privileges for these, so don't await/block UI
      try {
        (supabase as any)
          .from("marketing_questionnaires")
          .update({ total_responses: ((q as any).total_responses || 0) + 1 })
          .eq("id", q.id)
          .then(() => {}, () => {});
      } catch {}

      if (q.send_to_crm && (lead.name || lead.email || lead.phone)) {
        try {
          (supabase as any).from("customers").insert({
            user_id: q.user_id,
            name: lead.name || lead.email || "Lead Questionário",
            email: lead.email || null,
            phone: lead.phone || null,
            status: "lead",
            notes: `Origem: Questionário "${q.title}"`,
            tags: ["questionario"],
          }).then(() => {}, () => {});
        } catch {}
      }
    } catch (e: any) {
      toast.error(e?.message || "Erro ao finalizar");
    } finally {
      setSubmitting(false);
    }
  };

  const next = () => {
    const qq = q!.questions[current];
    if (qq.required) {
      const a = answers[qq.id];
      if (qq.type === "choice" && !a) return toast.error("Selecione uma opção");
      if (qq.type === "text" && (!a || !String(a).trim())) return toast.error("Preencha sua resposta");
    }
    if (current < q!.questions.length - 1) setCurrent(current + 1);
    else finishQuestions();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  if (!q) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Questionário não encontrado ou inativo.</div>;

  const accent = q.primary_color || "#6366f1";
  const btnBg = q.button_color || accent;
  const btnText = q.button_text_color || "#ffffff";
  const bg = q.background_color || "#ffffff";
  const qColor = q.question_color || "#0f172a";
  const tColor = q.text_color || "#334155";
  const anim = q.button_animation && q.button_animation !== "none" ? `popup-anim-${q.button_animation}` : "";

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: `linear-gradient(135deg, ${accent}15, ${accent}05)` }}>
      <style>{`
        @keyframes popup-anim-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
        @keyframes popup-anim-bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @keyframes popup-anim-shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}
        @keyframes popup-anim-ring{0%,100%{transform:rotate(0)}10%,30%{transform:rotate(-12deg)}20%,40%{transform:rotate(12deg)}50%{transform:rotate(0)}}
        @keyframes popup-anim-glow{0%,100%{box-shadow:0 0 0 0 rgba(99,102,241,.6)}50%{box-shadow:0 0 0 12px rgba(99,102,241,0)}}
        .popup-anim-pulse{animation:popup-anim-pulse 1.4s ease-in-out infinite}
        .popup-anim-bounce{animation:popup-anim-bounce 1.2s ease-in-out infinite}
        .popup-anim-shake{animation:popup-anim-shake .9s ease-in-out infinite}
        .popup-anim-ring{animation:popup-anim-ring 1.6s ease-in-out infinite}
        .popup-anim-glow{animation:popup-anim-glow 1.5s ease-out infinite}
      `}</style>
      <Card className="w-full max-w-2xl shadow-xl" style={{ background: bg }}>
        {q.cover_image && stage === "intro" && (
          <div className="w-full aspect-video rounded-t-lg bg-cover bg-center" style={{ backgroundImage: `url(${q.cover_image})` }} />
        )}
        <CardContent className="p-6 sm:p-10 space-y-6">
          {q.countdown_enabled && q.countdown_ends_at && stage !== "done" && (
            <CountdownTimer
              endsAt={q.countdown_ends_at}
              label={q.countdown_label}
              bgColor={q.countdown_bg_color}
              textColor={q.countdown_text_color}
            />
          )}
          {stage === "intro" && (
            <div className="text-center space-y-4">
              <h1 className="text-3xl font-bold" style={{ color: qColor }}>{q.title}</h1>
              {q.description && <p className="whitespace-pre-wrap" style={{ color: tColor }}>{q.description}</p>}
              <Button size="lg" onClick={start} style={{ backgroundColor: btnBg, color: btnText }} className={anim}>
                Começar <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {stage === "capture" && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold" style={{ color: qColor }}>Antes de começar</h2>
              {q.capture_fields.includes("name") && (
                <div><Label style={{ color: tColor }}>Nome</Label><Input value={lead.name} onChange={(e) => setLead({ ...lead, name: e.target.value })} /></div>
              )}
              {q.capture_fields.includes("email") && (
                <div><Label style={{ color: tColor }}>E-mail</Label><Input type="email" value={lead.email} onChange={(e) => setLead({ ...lead, email: e.target.value })} /></div>
              )}
              {q.capture_fields.includes("phone") && (
                <div><Label style={{ color: tColor }}>Telefone</Label><Input value={lead.phone} onChange={(e) => setLead({ ...lead, phone: e.target.value })} /></div>
              )}
              <Button className={`w-full ${anim}`} onClick={submitCapture} style={{ backgroundColor: btnBg, color: btnText }}>
                Continuar <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {stage === "questions" && q.questions.length > 0 && (() => {
            const qq = q.questions[current];
            return (
              <div className="space-y-5">
                <Progress value={((current + 1) / q.questions.length) * 100} />
                <p className="text-xs text-muted-foreground">Pergunta {current + 1} de {q.questions.length}</p>
                <h2 className="text-xl font-semibold" style={{ color: qColor }}>{qq.text}</h2>
                {qq.type === "choice" ? (
                  <div className="space-y-2">
                    {qq.options.map((opt) => {
                      const selected = answers[qq.id] === opt.id;
                      return (
                        <button key={opt.id} type="button"
                          onClick={() => setAnswers({ ...answers, [qq.id]: opt.id })}
                          className={`w-full text-left p-4 rounded-lg border-2 transition ${selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                          style={selected ? { borderColor: btnBg, backgroundColor: `${btnBg}10`, color: tColor } : { color: tColor }}>
                          {opt.text}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <Textarea rows={4} value={answers[qq.id] || ""} onChange={(e) => setAnswers({ ...answers, [qq.id]: e.target.value })} placeholder="Sua resposta..." />
                )}
                <div className="flex justify-between gap-2">
                  {current > 0 ? (
                    <Button variant="outline" onClick={() => setCurrent(current - 1)}>Voltar</Button>
                  ) : <span />}
                  <Button onClick={next} disabled={submitting} style={{ backgroundColor: accent }} className="text-white">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> :
                      current === q.questions.length - 1 ? "Finalizar" : <>Próxima <ArrowRight className="w-4 h-4 ml-1" /></>}
                  </Button>
                </div>
              </div>
            );
          })()}

          {stage === "questions" && q.questions.length === 0 && (
            <div className="text-center text-muted-foreground">Este questionário ainda não tem perguntas.</div>
          )}

          {stage === "done" && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <CheckCircle2 className="w-14 h-14 mx-auto" style={{ color: accent }} />
                <h2 className="text-2xl font-bold">{q.thank_you_title}</h2>
                <p className="text-muted-foreground">{q.thank_you_description}</p>
              </div>
              <div className="space-y-3">
                {matchedOffers.map((o) => (
                  <Card key={o.id}><CardContent className="p-4 flex gap-4 items-center">
                    {o.image_url && <img src={o.image_url} alt="" className="w-20 h-20 rounded object-cover" />}
                    <div className="flex-1">
                      <h3 className="font-semibold">{o.title}</h3>
                      {o.description && <p className="text-sm text-muted-foreground">{o.description}</p>}
                    </div>
                    {o.button_url && (
                      <a href={o.button_url} target="_blank" rel="noreferrer">
                        <Button size="sm" style={{ backgroundColor: accent }} className="text-white">
                          {o.button_text || "Ver"} <ExternalLink className="w-3 h-3 ml-1" />
                        </Button>
                      </a>
                    )}
                  </CardContent></Card>
                ))}
                {matchedOffers.length === 0 && <p className="text-center text-muted-foreground">Sem ofertas configuradas.</p>}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
