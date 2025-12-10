import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowRight, RotateCcw, Gift, ExternalLink, CheckCircle2 } from "lucide-react";

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
}

interface Quiz {
  id: string;
  title: string;
  description?: string;
  questions: QuizQuestion[];
  responses_count?: number;
  collect_data?: boolean;
  collect_name?: boolean;
  collect_email?: boolean;
  collect_phone?: boolean;
  collect_whatsapp?: boolean;
  show_offer?: boolean;
  offer_title?: string;
  offer_description?: string;
  offer_button_text?: string;
  offer_button_link?: string;
  redirect_url?: string;
}

export default function QuizPage() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showDataForm, setShowDataForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    phone: '',
    whatsapp: ''
  });

  useEffect(() => {
    loadQuiz();
  }, [quizId]);

  const loadQuiz = async () => {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', quizId)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      setQuiz(data as any);
    } catch (error: any) {
      toast.error("Quiz não encontrado");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = answerIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < (quiz?.questions.length || 0) - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      if (quiz?.collect_data) {
        setShowDataForm(true);
      } else {
        handleFinish();
      }
    }
  };

  const handleSubmitData = async () => {
    // Validar dados obrigatórios
    if (quiz?.collect_name && !userData.name) {
      toast.error("Por favor, preencha seu nome");
      return;
    }
    if (quiz?.collect_email && !userData.email) {
      toast.error("Por favor, preencha seu email");
      return;
    }
    if (quiz?.collect_phone && !userData.phone) {
      toast.error("Por favor, preencha seu telefone");
      return;
    }
    if (quiz?.collect_whatsapp && !userData.whatsapp) {
      toast.error("Por favor, preencha seu WhatsApp");
      return;
    }

    try {
      // Salvar dados do lead
      await supabase
        .from('quiz_responses')
        .insert([{
          quiz_id: quizId,
          name: userData.name || null,
          email: userData.email || null,
          phone: userData.phone || null,
          whatsapp: userData.whatsapp || null,
          answers: selectedAnswers,
          score: 0
        }]);
    } catch (error) {
      console.error("Erro ao salvar dados:", error);
    }

    handleFinish();
  };

  const handleFinish = async () => {
    setShowDataForm(false);
    setShowResults(true);
    
    try {
      await supabase
        .from('quizzes')
        .update({ 
          responses_count: (quiz?.responses_count || 0) + 1 
        })
        .eq('id', quizId);
    } catch (error) {
      console.error("Erro ao atualizar contagem");
    }

    // Redirecionar após 8 segundos se configurado
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

  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;
  const currentQ = quiz.questions[currentQuestion];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-2xl glass shadow-glow">
        <CardHeader>
          <CardTitle className="text-3xl font-bold gradient-text">{quiz.title}</CardTitle>
          {quiz.description && (
            <CardDescription className="text-base">{quiz.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {showDataForm ? (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold">Últimos Detalhes!</h3>
                <p className="text-muted-foreground">Preencha seus dados para ver os resultados</p>
              </div>

              <div className="space-y-4">
                {quiz?.collect_name && (
                  <div className="space-y-2">
                    <Label>Nome Completo *</Label>
                    <Input
                      value={userData.name}
                      onChange={(e) => setUserData({...userData, name: e.target.value})}
                      placeholder="Digite seu nome"
                    />
                  </div>
                )}

                {quiz?.collect_email && (
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={userData.email}
                      onChange={(e) => setUserData({...userData, email: e.target.value})}
                      placeholder="seu@email.com"
                    />
                  </div>
                )}

                {quiz?.collect_phone && (
                  <div className="space-y-2">
                    <Label>Telefone *</Label>
                    <Input
                      value={userData.phone}
                      onChange={(e) => setUserData({...userData, phone: e.target.value})}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                )}

                {quiz?.collect_whatsapp && (
                  <div className="space-y-2">
                    <Label>WhatsApp *</Label>
                    <Input
                      value={userData.whatsapp}
                      onChange={(e) => setUserData({...userData, whatsapp: e.target.value})}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                )}
              </div>

              <Button
                onClick={handleSubmitData}
                className="w-full gradient-primary shadow-glow"
                size="lg"
              >
                Ver Resultado
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          ) : !showResults ? (
            <>
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Pergunta {currentQuestion + 1} de {quiz.questions.length}</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-semibold">{currentQ.question}</h3>
                
                <div className="grid gap-3">
                  {currentQ.options.map((option, index) => (
                    <Button
                      key={index}
                      variant={selectedAnswers[currentQuestion] === index ? "default" : "outline"}
                      className="w-full text-left justify-start h-auto py-4 px-6 text-base"
                      onClick={() => handleAnswerSelect(index)}
                    >
                      <span className="mr-3 font-bold">{String.fromCharCode(65 + index)}.</span>
                      {option}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleNext}
                  disabled={selectedAnswers[currentQuestion] === undefined}
                  className="gradient-primary shadow-glow"
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
              <div className="text-center space-y-4">
                <CheckCircle2 className="h-16 w-16 text-success mx-auto" />
                <h3 className="text-2xl font-bold">Quiz Concluído!</h3>
                <p className="text-muted-foreground">
                  Obrigado por responder ao quiz
                </p>
              </div>

              {/* Resumo das respostas */}
              <div className="space-y-3">
                <h4 className="font-semibold text-lg">Suas Respostas:</h4>
                {quiz.questions.map((question, qIndex) => (
                  <Card key={qIndex} className="p-4">
                    <p className="font-medium text-sm mb-1">{question.question}</p>
                    <p className="text-muted-foreground text-sm">
                      Resposta: {question.options[selectedAnswers[qIndex]]}
                    </p>
                  </Card>
                ))}
              </div>

              {/* Oferta */}
              {quiz?.show_offer && (
                <Card className="border-success bg-gradient-to-br from-success/10 to-success/5 shadow-glow">
                  <CardHeader className="text-center">
                    <div className="flex justify-center mb-2">
                      <Gift className="h-12 w-12 text-success" />
                    </div>
                    <CardTitle className="text-2xl">{quiz.offer_title || "Oferta Especial!"}</CardTitle>
                    <CardDescription className="text-base">
                      {quiz.offer_description}
                    </CardDescription>
                  </CardHeader>
                  {quiz.offer_button_link && (
                    <CardContent className="flex justify-center pb-6">
                      <Button
                        onClick={() => window.open(quiz.offer_button_link, '_blank')}
                        className="gradient-primary shadow-glow"
                        size="lg"
                      >
                        {quiz.offer_button_text || "Quero essa oferta!"}
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </Button>
                    </CardContent>
                  )}
                </Card>
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

              {quiz?.redirect_url && (
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