import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowRight, RotateCcw, Gift, ExternalLink, CheckCircle2, Trophy } from "lucide-react";

interface QuizOption {
  text: string;
  points: number;
}
interface QuizQuestion {
  question: string;
  options: QuizOption[];
}
interface QuizOffer {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  button_text: string;
  button_link: string;
}
interface ResultProfile {
  id: string;
  name: string;
  min_score: number;
  max_score: number;
  title: string;
  description: string;
  image_url?: string;
  video_url?: string;
  offers: QuizOffer[];
}
interface Quiz {
  id: string;
  user_id?: string;
  title: string;
  description?: string;
  questions: QuizQuestion[];
  responses_count?: number;
  collect_data?: boolean;
  collect_name?: boolean;
  collect_email?: boolean;
  collect_phone?: boolean;
  collect_whatsapp?: boolean;
  send_to_crm?: boolean;
  show_offer?: boolean;
  offer_title?: string;
  offer_description?: string;
  offer_button_text?: string;
  offer_button_link?: string;
  redirect_url?: string;
  primary_color?: string;
  secondary_color?: string;
  result_profiles?: ResultProfile[];
}

const normalizeOptions = (opts: any[]): QuizOption[] =>
  Array.isArray(opts)
    ? opts.map((o) =>
        typeof o === "string"
          ? { text: o, points: 0 }
          : { text: String(o?.text ?? ""), points: Number(o?.points ?? 0) }
      )
    : [];

export default function QuizPage() {
  const { quizId } = useParams();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showDataForm, setShowDataForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState({ name: "", email: "", phone: "", whatsapp: "" });

  useEffect(() => {
    loadQuiz();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId]);

  const loadQuiz = async () => {
    try {
      const { data, error } = await supabase
        .from("quizzes")
        .select("*")
        .eq("id", quizId)
        .eq("is_active", true)
        .single();
      if (error) throw error;
      const d: any = data;
      setQuiz({
        ...d,
        questions: Array.isArray(d.questions)
          ? d.questions.map((q: any) => ({
              question: String(q?.question ?? ""),
              options: normalizeOptions(q?.options ?? []),
            }))
          : [],
        result_profiles: Array.isArray(d.result_profiles) ? d.result_profiles : [],
      });
    } catch {
      toast.error("Quiz não encontrado");
    } finally {
      setLoading(false);
    }
  };

  const totalScore = useMemo(() => {
    if (!quiz) return 0;
    return quiz.questions.reduce((sum, q, i) => {
      const idx = selectedAnswers[i];
      const opt = q.options?.[idx];
      return sum + (opt ? Number(opt.points) || 0 : 0);
    }, 0);
  }, [quiz, selectedAnswers]);

  const matchedProfile = useMemo<ResultProfile | null>(() => {
    if (!quiz?.result_profiles?.length) return null;
    return (
      quiz.result_profiles.find(
        (p) => totalScore >= Number(p.min_score) && totalScore <= Number(p.max_score)
      ) || null
    );
  }, [quiz, totalScore]);

  const handleAnswerSelect = (answerIndex: number) => {
    const next = [...selectedAnswers];
    next[currentQuestion] = answerIndex;
    setSelectedAnswers(next);
  };

  const handleNext = () => {
    if (currentQuestion < (quiz?.questions.length || 0) - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      if (quiz?.collect_data) setShowDataForm(true);
      else handleFinish();
    }
  };

  const handleSubmitData = async () => {
    if (quiz?.collect_name && !userData.name) return toast.error("Preencha seu nome");
    if (quiz?.collect_email && !userData.email) return toast.error("Preencha seu email");
    if (quiz?.collect_phone && !userData.phone) return toast.error("Preencha seu telefone");
    if (quiz?.collect_whatsapp && !userData.whatsapp) return toast.error("Preencha seu WhatsApp");

    try {
      await supabase.from("quiz_responses").insert([
        {
          quiz_id: quizId,
          name: userData.name || null,
          email: userData.email || null,
          phone: userData.phone || null,
          whatsapp: userData.whatsapp || null,
          answers: selectedAnswers,
          score: totalScore,
        },
      ]);

      // Envia ao CRM (customers) se ativado
      if (quiz?.send_to_crm && quiz.user_id && (userData.name || userData.email || userData.phone || userData.whatsapp)) {
        await supabase.from("customers").insert([
          {
            user_id: quiz.user_id,
            name: userData.name || userData.email || "Lead do Quiz",
            email: userData.email || null,
            phone: userData.phone || userData.whatsapp || null,
            status: "lead",
            notes: `Origem: Quiz "${quiz.title}"${matchedProfile ? ` · Perfil: ${matchedProfile.name}` : ""} · Pontuação: ${totalScore}`,
            tags: ["quiz", quiz.title].filter(Boolean) as any,
          },
        ]);
      }
    } catch (e) {
      console.error("Erro ao salvar lead:", e);
    }

    handleFinish();
  };

  const handleFinish = async () => {
    setShowDataForm(false);
    setShowResults(true);
    try {
      await supabase
        .from("quizzes")
        .update({ responses_count: (quiz?.responses_count || 0) + 1 })
        .eq("id", quizId);
    } catch {}
    if (quiz?.redirect_url) {
      setTimeout(() => {
        window.location.href = quiz.redirect_url!;
      }, 8000);
    }
  };

  const handleRestart = () => {
    setCurrentQuestion(0);
    setSelectedAnswers([]);
    setShowResults(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <Card className="w-full max-w-2xl mx-4">
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Carregando quiz...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <Card className="w-full max-w-2xl mx-4">
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Quiz não encontrado</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progress = ((currentQuestion + 1) / Math.max(quiz.questions.length, 1)) * 100;
  const currentQ = quiz.questions[currentQuestion];
  const primaryColor = quiz.primary_color || "#8B5CF6";
  const secondaryColor = quiz.secondary_color || "#0EA5E9";

  const offersToShow: QuizOffer[] = matchedProfile?.offers?.length
    ? matchedProfile.offers
    : quiz.show_offer
    ? [
        {
          id: "fallback",
          title: quiz.offer_title || "Oferta Especial!",
          description: quiz.offer_description || "",
          button_text: quiz.offer_button_text || "Quero essa oferta!",
          button_link: quiz.offer_button_link || "",
        },
      ]
    : [];

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: `linear-gradient(135deg, ${primaryColor}15 0%, ${secondaryColor}15 100%)`,
      }}
    >
      <Card
        className="w-full max-w-2xl shadow-xl border-2"
        style={{ borderColor: `${primaryColor}30` }}
      >
        <CardHeader>
          <CardTitle className="text-3xl font-bold" style={{ color: primaryColor }}>
            {quiz.title}
          </CardTitle>
          {quiz.description && (
            <CardDescription className="text-base">{quiz.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {showDataForm ? (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold">Últimos Detalhes!</h3>
                <p className="text-muted-foreground">
                  Preencha seus dados para ver os resultados
                </p>
              </div>
              <div className="space-y-4">
                {quiz.collect_name && (
                  <div className="space-y-2">
                    <Label>Nome Completo *</Label>
                    <Input
                      value={userData.name}
                      onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                    />
                  </div>
                )}
                {quiz.collect_email && (
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={userData.email}
                      onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                    />
                  </div>
                )}
                {quiz.collect_phone && (
                  <div className="space-y-2">
                    <Label>Telefone *</Label>
                    <Input
                      value={userData.phone}
                      onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
                    />
                  </div>
                )}
                {quiz.collect_whatsapp && (
                  <div className="space-y-2">
                    <Label>WhatsApp *</Label>
                    <Input
                      value={userData.whatsapp}
                      onChange={(e) => setUserData({ ...userData, whatsapp: e.target.value })}
                    />
                  </div>
                )}
              </div>
              <Button
                onClick={handleSubmitData}
                className="w-full text-white shadow-lg"
                style={{ backgroundColor: primaryColor }}
                size="lg"
              >
                Ver Resultado <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          ) : !showResults ? (
            <>
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>
                    Pergunta {currentQuestion + 1} de {quiz.questions.length}
                  </span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${progress}%`, backgroundColor: primaryColor }}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">{currentQ?.question}</h3>
                <div className="grid gap-3">
                  {currentQ?.options.map((option, index) => (
                    <Button
                      key={index}
                      variant={selectedAnswers[currentQuestion] === index ? "default" : "outline"}
                      className="w-full text-left justify-start h-auto py-4 px-6 text-base whitespace-normal"
                      style={
                        selectedAnswers[currentQuestion] === index
                          ? { backgroundColor: primaryColor }
                          : { borderColor: `${primaryColor}50` }
                      }
                      onClick={() => handleAnswerSelect(index)}
                    >
                      <span className="mr-3 font-bold">
                        {String.fromCharCode(65 + index)}.
                      </span>
                      {option.text}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={handleNext}
                  disabled={selectedAnswers[currentQuestion] === undefined}
                  className="text-white shadow-lg"
                  style={{ backgroundColor: primaryColor }}
                  size="lg"
                >
                  {currentQuestion < quiz.questions.length - 1 ? (
                    <>
                      Próxima <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  ) : (
                    "Finalizar Quiz"
                  )}
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-6">
              {matchedProfile ? (
                <div className="space-y-4">
                  <div className="text-center space-y-3">
                    <Trophy className="h-14 w-14 mx-auto" style={{ color: primaryColor }} />
                    <h3 className="text-3xl font-bold" style={{ color: primaryColor }}>
                      {matchedProfile.title || matchedProfile.name}
                    </h3>
                    <p className="text-muted-foreground">{matchedProfile.description}</p>
                    <p className="text-sm font-semibold">Pontuação: {totalScore}</p>
                  </div>
                  {matchedProfile.image_url && (
                    <img
                      src={matchedProfile.image_url}
                      alt={matchedProfile.title}
                      className="w-full rounded-lg"
                    />
                  )}
                  {matchedProfile.video_url && (
                    <div className="aspect-video w-full rounded-lg overflow-hidden">
                      <iframe
                        src={matchedProfile.video_url}
                        className="w-full h-full"
                        allow="autoplay; encrypted-media; picture-in-picture"
                        allowFullScreen
                        title="Video"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <CheckCircle2
                    className="h-16 w-16 mx-auto"
                    style={{ color: primaryColor }}
                  />
                  <h3 className="text-2xl font-bold">Quiz Concluído!</h3>
                  <p className="text-muted-foreground">Pontuação: {totalScore}</p>
                </div>
              )}

              {offersToShow.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg flex items-center gap-2">
                    <Gift className="h-5 w-5" style={{ color: primaryColor }} />
                    Ofertas para você
                  </h4>
                  <div className="grid gap-3">
                    {offersToShow.map((offer) => (
                      <Card
                        key={offer.id}
                        className="shadow-md"
                        style={{
                          borderColor: primaryColor,
                          backgroundColor: `${primaryColor}08`,
                        }}
                      >
                        {offer.image_url && (
                          <img
                            src={offer.image_url}
                            alt={offer.title}
                            className="w-full max-h-48 object-cover rounded-t-lg"
                          />
                        )}
                        <CardHeader>
                          <CardTitle className="text-xl">{offer.title}</CardTitle>
                          <CardDescription>{offer.description}</CardDescription>
                        </CardHeader>
                        {offer.button_link && (
                          <CardContent>
                            <Button
                              onClick={() => window.open(offer.button_link, "_blank")}
                              className="w-full text-white shadow-lg"
                              style={{ backgroundColor: primaryColor }}
                              size="lg"
                            >
                              {offer.button_text || "Quero!"}
                              <ExternalLink className="ml-2 h-4 w-4" />
                            </Button>
                          </CardContent>
                        )}
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              <Button
                onClick={handleRestart}
                className="w-full"
                variant="outline"
                size="lg"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Refazer Quiz
              </Button>

              {quiz.redirect_url && (
                <p className="text-center text-sm text-muted-foreground">
                  Você será redirecionado em alguns segundos...
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
