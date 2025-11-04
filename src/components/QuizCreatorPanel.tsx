import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  HelpCircle, 
  Plus,
  Eye,
  Trash2,
  Edit,
  Copy,
  BarChart3,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Quiz {
  id: string;
  title: string;
  description?: string;
  questions: QuizQuestion[];
  is_active: boolean;
  responses_count: number;
  created_at: string;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation?: string;
}

export const QuizCreatorPanel = () => {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [customDomains, setCustomDomains] = useState<Array<{id: string; domain: string; is_verified: boolean}>>([]);
  const [selectedCustomDomain, setSelectedCustomDomain] = useState("");
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    custom_domain: '',
    questions: [
      {
        question: '',
        options: ['', '', '', ''],
        correct_answer: 0,
        explanation: ''
      }
    ]
  });

  useEffect(() => {
    loadQuizzes();
    fetchCustomDomains();
  }, []);

  const fetchCustomDomains = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const { data } = await supabase
      .from('user_domains')
      .select('id, domain, is_verified')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (data) {
      setCustomDomains(data);
    }
  };

  const loadQuizzes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuizzes(data as any || []);
    } catch (error: any) {
      toast.error("Erro ao carregar quizzes");
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = () => {
    setFormData({
      ...formData,
      questions: [
        ...formData.questions,
        {
          question: '',
          options: ['', '', '', ''],
          correct_answer: 0,
          explanation: ''
        }
      ]
    });
  };

  const handleRemoveQuestion = (index: number) => {
    const newQuestions = formData.questions.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      questions: newQuestions
    });
  };

  const handleUpdateQuestion = (index: number, field: string, value: any) => {
    const newQuestions = [...formData.questions];
    newQuestions[index] = {
      ...newQuestions[index],
      [field]: value
    };
    setFormData({
      ...formData,
      questions: newQuestions
    });
  };

  const handleUpdateOption = (qIndex: number, oIndex: number, value: string) => {
    const newQuestions = [...formData.questions];
    newQuestions[qIndex].options[oIndex] = value;
    setFormData({
      ...formData,
      questions: newQuestions
    });
  };

  const handleAddQuiz = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('quizzes')
        .insert([{
          user_id: user.id,
          title: formData.title,
          description: formData.description,
          custom_domain: selectedCustomDomain,
          questions: formData.questions,
          is_active: true,
          responses_count: 0
        }]);

      if (error) throw error;

      toast.success("Quiz criado com sucesso!");
      setIsAddDialogOpen(false);
      loadQuizzes();
      
      setFormData({
        title: '',
        description: '',
        custom_domain: '',
        questions: [
          {
            question: '',
            options: ['', '', '', ''],
            correct_answer: 0,
            explanation: ''
          }
        ]
      });
      setSelectedCustomDomain('');
    } catch (error: any) {
      toast.error("Erro ao criar quiz");
    }
  };

  const handleDeleteQuiz = async (id: string) => {
    try {
      const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success("Quiz excluído!");
      loadQuizzes();
    } catch (error: any) {
      toast.error("Erro ao excluir quiz");
    }
  };

  const handleCopyLink = (quizId: string) => {
    const link = `${window.location.origin}/quiz/${quizId}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copiado!");
  };

  const totalResponses = quizzes.reduce((sum, q) => sum + q.responses_count, 0);
  const totalQuestions = quizzes.reduce((sum, q) => sum + (q.questions?.length || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Criador de Quiz</h2>
          <p className="text-muted-foreground">Crie quizzes interativos para engajar sua audiência</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary shadow-glow">
              <Plus className="mr-2 h-4 w-4" />
              Criar Quiz
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Novo Quiz</DialogTitle>
              <DialogDescription>Configure seu quiz interativo</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Título do Quiz</Label>
                <Input 
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Ex: Quanto você sabe sobre Marketing Digital?"
                />
              </div>
              <div className="grid gap-2">
                <Label>Descrição</Label>
                <Textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Descrição do quiz..."
                  rows={2}
                />
              </div>

              <div>
                <Label>Domínio Customizado (Opcional)</Label>
                <Select
                  value={selectedCustomDomain}
                  onValueChange={setSelectedCustomDomain}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Usar domínio padrão" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">
                      {window.location.host} (padrão)
                    </SelectItem>
                    {customDomains.filter(d => d.is_verified).map((domain) => (
                      <SelectItem key={domain.id} value={domain.domain}>
                        ✓ {domain.domain}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {customDomains.filter(d => d.is_verified).length === 0 
                    ? "Adicione e verifique um domínio em 'Gerenciador de Domínios'" 
                    : "Selecione um domínio verificado para usar"}
                </p>
              </div>

              <div className="space-y-4 mt-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Perguntas</h3>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={handleAddQuestion}
                  >
                    <Plus className="mr-2 h-3 w-3" />
                    Adicionar Pergunta
                  </Button>
                </div>

                {formData.questions.map((question, qIndex) => (
                  <Card key={qIndex} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">Pergunta {qIndex + 1}</Badge>
                        {formData.questions.length > 1 && (
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleRemoveQuestion(qIndex)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>

                      <div className="grid gap-2">
                        <Label>Pergunta</Label>
                        <Input 
                          value={question.question}
                          onChange={(e) => handleUpdateQuestion(qIndex, 'question', e.target.value)}
                          placeholder="Digite sua pergunta"
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label>Opções de Resposta</Label>
                        {question.options.map((option, oIndex) => (
                          <div key={oIndex} className="flex items-center gap-2">
                            <Input 
                              value={option}
                              onChange={(e) => handleUpdateOption(qIndex, oIndex, e.target.value)}
                              placeholder={`Opção ${oIndex + 1}`}
                            />
                            <Button
                              type="button"
                              variant={question.correct_answer === oIndex ? "default" : "outline"}
                              size="icon"
                              onClick={() => handleUpdateQuestion(qIndex, 'correct_answer', oIndex)}
                              title="Marcar como resposta correta"
                            >
                              {question.correct_answer === oIndex ? (
                                <CheckCircle2 className="h-4 w-4" />
                              ) : (
                                <XCircle className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        ))}
                      </div>

                      <div className="grid gap-2">
                        <Label>Explicação (Opcional)</Label>
                        <Textarea 
                          value={question.explanation}
                          onChange={(e) => handleUpdateQuestion(qIndex, 'explanation', e.target.value)}
                          placeholder="Explique a resposta correta..."
                          rows={2}
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddQuiz} className="gradient-primary">
                Criar Quiz
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="glass hover:shadow-glow transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Quizzes</CardTitle>
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quizzes.length}</div>
            <p className="text-xs text-muted-foreground">
              {quizzes.filter(q => q.is_active).length} ativos
            </p>
          </CardContent>
        </Card>

        <Card className="glass hover:shadow-glow transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Perguntas</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalQuestions}</div>
            <p className="text-xs text-muted-foreground">total de perguntas</p>
          </CardContent>
        </Card>

        <Card className="glass hover:shadow-glow transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Respostas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalResponses}</div>
            <p className="text-xs text-muted-foreground">participações</p>
          </CardContent>
        </Card>

        <Card className="glass hover:shadow-glow transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {quizzes.length > 0 ? Math.round(totalResponses / quizzes.length) : 0}
            </div>
            <p className="text-xs text-muted-foreground">respostas/quiz</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Quizzes */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>Meus Quizzes</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : quizzes.length === 0 ? (
            <div className="text-center py-12">
              <HelpCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                Nenhum quiz criado ainda
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)} className="gradient-primary">
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeiro Quiz
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {quizzes.map((quiz) => (
                <Card key={quiz.id} className="hover:shadow-lg transition-smooth">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base mb-1">{quiz.title}</CardTitle>
                        <Badge variant={quiz.is_active ? 'default' : 'secondary'} className="mt-2">
                          {quiz.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {quiz.description}
                    </p>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Perguntas</p>
                        <p className="font-semibold">{quiz.questions?.length || 0}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Respostas</p>
                        <p className="font-semibold text-success">{quiz.responses_count}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleCopyLink(quiz.id)}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copiar Link
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => navigate(`/quiz/${quiz.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => handleDeleteQuiz(quiz.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
