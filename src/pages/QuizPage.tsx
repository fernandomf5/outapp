import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle2, XCircle, ArrowRight, RotateCcw } from "lucide-react";

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation?: string;
}

interface Quiz {
  id: string;
  title: string;
  description?: string;
  questions: QuizQuestion[];
}

export default function QuizPage() {
  const { quizId } = useParams();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(true);

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
      handleFinish();
    }
  };

  const handleFinish = async () => {
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
  };

  const handleRestart = () => {
    setCurrentQuestion(0);
    setSelectedAnswers([]);
    setShowResults(false);
  };

  const calculateScore = () => {
    if (!quiz) return 0;
    let correct = 0;
    quiz.questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correct_answer) {
        correct++;
      }
    });
    return Math.round((correct / quiz.questions.length) * 100);
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
          {!showResults ? (
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
                <div className="text-6xl font-bold gradient-text">
                  {calculateScore()}%
                </div>
                <p className="text-xl text-muted-foreground">
                  Você acertou {selectedAnswers.filter((ans, idx) => ans === quiz.questions[idx].correct_answer).length} de {quiz.questions.length} perguntas
                </p>
              </div>

              <div className="space-y-4">
                {quiz.questions.map((question, qIndex) => {
                  const isCorrect = selectedAnswers[qIndex] === question.correct_answer;
                  return (
                    <Card key={qIndex} className={isCorrect ? "border-success/50 bg-success/5" : "border-destructive/50 bg-destructive/5"}>
                      <CardHeader>
                        <div className="flex items-start gap-3">
                          {isCorrect ? (
                            <CheckCircle2 className="h-6 w-6 text-success mt-1 flex-shrink-0" />
                          ) : (
                            <XCircle className="h-6 w-6 text-destructive mt-1 flex-shrink-0" />
                          )}
                          <div className="flex-1">
                            <CardTitle className="text-base">{question.question}</CardTitle>
                            <div className="mt-2 space-y-1">
                              <p className="text-sm">
                                <span className="font-semibold">Sua resposta: </span>
                                {question.options[selectedAnswers[qIndex]]}
                              </p>
                              {!isCorrect && (
                                <p className="text-sm text-success">
                                  <span className="font-semibold">Resposta correta: </span>
                                  {question.options[question.correct_answer]}
                                </p>
                              )}
                              {question.explanation && (
                                <p className="text-sm text-muted-foreground mt-2">
                                  {question.explanation}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  );
                })}
              </div>

              <Button
                onClick={handleRestart}
                className="w-full gradient-primary shadow-glow"
                size="lg"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Refazer Quiz
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
