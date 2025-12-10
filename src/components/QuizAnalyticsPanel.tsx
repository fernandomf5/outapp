import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart3, 
  Users, 
  TrendingUp, 
  Calendar,
  ArrowLeft,
  Mail,
  Phone,
  MessageSquare
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";

interface Quiz {
  id: string;
  title: string;
  questions: { question: string; options: string[] }[];
}

interface QuizResponse {
  id: string;
  quiz_id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  answers: Record<string, string>;
  created_at: string;
}

interface QuizAnalyticsPanelProps {
  quizId: string;
  onBack: () => void;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export const QuizAnalyticsPanel = ({ quizId, onBack }: QuizAnalyticsPanelProps) => {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [responses, setResponses] = useState<QuizResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState<string>("all");

  useEffect(() => {
    loadData();
  }, [quizId]);

  const loadData = async () => {
    try {
      // Load quiz
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', quizId)
        .single();

      if (quizError) throw quizError;
      setQuiz(quizData as any);

      // Load responses
      const { data: responsesData, error: responsesError } = await supabase
        .from('quiz_responses')
        .select('*')
        .eq('quiz_id', quizId)
        .order('created_at', { ascending: false });

      if (responsesError) throw responsesError;
      setResponses(responsesData as any || []);
    } catch (error) {
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  // Calculate answer distribution for a specific question
  const getAnswerDistribution = (questionIndex: number) => {
    if (!quiz) return [];
    
    const question = quiz.questions[questionIndex];
    if (!question) return [];

    const distribution: Record<string, number> = {};
    question.options.forEach(opt => {
      distribution[opt] = 0;
    });

    responses.forEach(response => {
      const answer = response.answers[questionIndex.toString()];
      if (answer && distribution.hasOwnProperty(answer)) {
        distribution[answer]++;
      }
    });

    return Object.entries(distribution).map(([name, value]) => ({
      name: name.length > 20 ? name.substring(0, 20) + '...' : name,
      fullName: name,
      value,
      percentage: responses.length > 0 ? Math.round((value / responses.length) * 100) : 0
    }));
  };

  // Get responses over time
  const getResponsesOverTime = () => {
    const grouped: Record<string, number> = {};
    
    responses.forEach(response => {
      const date = format(new Date(response.created_at), 'dd/MM', { locale: ptBR });
      grouped[date] = (grouped[date] || 0) + 1;
    });

    return Object.entries(grouped)
      .slice(-14) // Last 14 days
      .map(([date, count]) => ({ date, respostas: count }));
  };

  // Get lead capture stats
  const getLeadStats = () => {
    const withEmail = responses.filter(r => r.email).length;
    const withPhone = responses.filter(r => r.phone).length;
    const withWhatsapp = responses.filter(r => r.whatsapp).length;
    const withName = responses.filter(r => r.name).length;

    return { withEmail, withPhone, withWhatsapp, withName };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Quiz não encontrado</p>
        <Button onClick={onBack} className="mt-4">Voltar</Button>
      </div>
    );
  }

  const leadStats = getLeadStats();
  const responsesOverTime = getResponsesOverTime();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold">Analytics: {quiz.title}</h2>
          <p className="text-muted-foreground">Dados e métricas do seu quiz</p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Respostas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{responses.length}</div>
            <p className="text-xs text-muted-foreground">participantes</p>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails Capturados</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leadStats.withEmail}</div>
            <p className="text-xs text-muted-foreground">
              {responses.length > 0 ? Math.round((leadStats.withEmail / responses.length) * 100) : 0}% dos participantes
            </p>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Telefones</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leadStats.withPhone}</div>
            <p className="text-xs text-muted-foreground">
              {responses.length > 0 ? Math.round((leadStats.withPhone / responses.length) * 100) : 0}% dos participantes
            </p>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">WhatsApp</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leadStats.withWhatsapp}</div>
            <p className="text-xs text-muted-foreground">
              {responses.length > 0 ? Math.round((leadStats.withWhatsapp / responses.length) * 100) : 0}% dos participantes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Responses Over Time */}
      {responsesOverTime.length > 0 && (
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Respostas ao Longo do Tempo
            </CardTitle>
            <CardDescription>Últimos 14 dias de atividade</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={responsesOverTime}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="respostas" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Question Analysis */}
      <Card className="glass">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Análise por Pergunta
              </CardTitle>
              <CardDescription>Distribuição das respostas em cada pergunta</CardDescription>
            </div>
            <Select value={selectedQuestion} onValueChange={setSelectedQuestion}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Selecione uma pergunta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Perguntas</SelectItem>
                {quiz.questions.map((q, idx) => (
                  <SelectItem key={idx} value={idx.toString()}>
                    Pergunta {idx + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {selectedQuestion === "all" ? (
            <div className="space-y-8">
              {quiz.questions.map((question, qIdx) => {
                const distribution = getAnswerDistribution(qIdx);
                return (
                  <div key={qIdx} className="space-y-4">
                    <div>
                      <Badge variant="outline" className="mb-2">Pergunta {qIdx + 1}</Badge>
                      <h4 className="font-medium">{question.question}</h4>
                    </div>
                    <div className="space-y-2">
                      {distribution.map((item, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="truncate max-w-[70%]" title={item.fullName}>
                              {item.name}
                            </span>
                            <span className="font-medium">{item.value} ({item.percentage}%)</span>
                          </div>
                          <Progress value={item.percentage} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium">{quiz.questions[parseInt(selectedQuestion)]?.question}</h4>
                <div className="space-y-2">
                  {getAnswerDistribution(parseInt(selectedQuestion)).map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="truncate max-w-[70%]" title={item.fullName}>
                          {item.name}
                        </span>
                        <span className="font-medium">{item.value} ({item.percentage}%)</span>
                      </div>
                      <Progress value={item.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getAnswerDistribution(parseInt(selectedQuestion))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${percentage}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getAnswerDistribution(parseInt(selectedQuestion)).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Responses */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Respostas Recentes
          </CardTitle>
          <CardDescription>Últimas participações no quiz</CardDescription>
        </CardHeader>
        <CardContent>
          {responses.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma resposta ainda
            </p>
          ) : (
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {responses.slice(0, 20).map((response) => (
                <div 
                  key={response.id} 
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{response.name || 'Anônimo'}</p>
                    <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                      {response.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {response.email}
                        </span>
                      )}
                      {response.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {response.phone}
                        </span>
                      )}
                      {response.whatsapp && (
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {response.whatsapp}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(response.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                    <Badge variant="outline" className="mt-1">
                      {Object.keys(response.answers || {}).length} respostas
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
