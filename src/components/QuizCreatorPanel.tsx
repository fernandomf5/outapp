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
import { Palette } from "lucide-react";
import { 
  HelpCircle, 
  Plus,
  Eye,
  Trash2,
  Edit,
  Copy,
  BarChart3,
  CheckCircle2,
  XCircle,
  Gift,
  Link as LinkIcon,
  PieChart
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { QuizAnalyticsPanel } from "./QuizAnalyticsPanel";

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
}

export const QuizCreatorPanel = () => {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [analyticsQuizId, setAnalyticsQuizId] = useState<string | null>(null);
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null);
  
  const initialFormData = {
    title: '',
    description: '',
    primary_color: '#8B5CF6',
    secondary_color: '#0EA5E9',
    collect_data: false,
    collect_name: true,
    collect_email: true,
    collect_phone: false,
    collect_whatsapp: false,
    show_offer: false,
    offer_title: '',
    offer_description: '',
    offer_button_text: 'Quero essa oferta!',
    offer_button_link: '',
    redirect_url: '',
    questions: [
      {
        question: '',
        options: ['', '', '', '']
      }
    ]
  };
  
  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    loadQuizzes();
  }, []);

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
          options: ['', '', '', '']
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

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleEditQuiz = async (quiz: Quiz) => {
    const { data, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', quiz.id)
      .single();

    if (error || !data) {
      toast.error("Erro ao carregar quiz");
      return;
    }

    setFormData({
      title: data.title || '',
      description: data.description || '',
      primary_color: data.primary_color || '#8B5CF6',
      secondary_color: data.secondary_color || '#0EA5E9',
      collect_data: data.collect_data || false,
      collect_name: data.collect_name ?? true,
      collect_email: data.collect_email ?? true,
      collect_phone: data.collect_phone || false,
      collect_whatsapp: data.collect_whatsapp || false,
      show_offer: data.show_offer || false,
      offer_title: data.offer_title || '',
      offer_description: data.offer_description || '',
      offer_button_text: data.offer_button_text || 'Quero essa oferta!',
      offer_button_link: data.offer_button_link || '',
      redirect_url: data.redirect_url || '',
      questions: Array.isArray(data.questions) ? data.questions as { question: string; options: string[] }[] : [{ question: '', options: ['', '', '', ''] }]
    });
    setEditingQuizId(quiz.id);
    setIsAddDialogOpen(true);
  };

  const handleSaveQuiz = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (!formData.title) {
        toast.error("Preencha o título do quiz");
        return;
      }

      const quizData = {
        title: formData.title,
        description: formData.description,
        primary_color: formData.primary_color,
        secondary_color: formData.secondary_color,
        questions: formData.questions,
        collect_data: formData.collect_data,
        collect_name: formData.collect_name,
        collect_email: formData.collect_email,
        collect_phone: formData.collect_phone,
        collect_whatsapp: formData.collect_whatsapp,
        show_offer: formData.show_offer,
        offer_title: formData.offer_title,
        offer_description: formData.offer_description,
        offer_button_text: formData.offer_button_text,
        offer_button_link: formData.offer_button_link,
        redirect_url: formData.redirect_url,
      };

      if (editingQuizId) {
        const { error } = await supabase
          .from('quizzes')
          .update(quizData)
          .eq('id', editingQuizId);

        if (error) throw error;
        toast.success("Quiz atualizado com sucesso!");
      } else {
        const { error } = await supabase
          .from('quizzes')
          .insert([{
            ...quizData,
            user_id: user.id,
            is_active: true,
            responses_count: 0
          }]);

        if (error) throw error;
        toast.success("Quiz criado com sucesso!");
      }

      setIsAddDialogOpen(false);
      setEditingQuizId(null);
      setFormData(initialFormData);
      loadQuizzes();
    } catch (error: any) {
      toast.error(editingQuizId ? "Erro ao atualizar quiz" : "Erro ao criar quiz");
    }
  };

  const handleCloseDialog = () => {
    setIsAddDialogOpen(false);
    setEditingQuizId(null);
    setFormData(initialFormData);
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

  // Show analytics panel if a quiz is selected
  if (analyticsQuizId) {
    return (
      <QuizAnalyticsPanel 
        quizId={analyticsQuizId} 
        onBack={() => setAnalyticsQuizId(null)} 
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Criador de Quiz</h2>
          <p className="text-muted-foreground">Crie quizzes interativos para engajar sua audiência</p>
        </div>
        <Button className="gradient-primary shadow-glow" onClick={() => { setEditingQuizId(null); setFormData(initialFormData); setIsAddDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Criar Quiz
        </Button>
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingQuizId ? 'Editar Quiz' : 'Criar Novo Quiz'}</DialogTitle>
              <DialogDescription>{editingQuizId ? 'Edite as configurações do seu quiz' : 'Configure seu quiz interativo'}</DialogDescription>
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

              {/* Personalização de Cores */}
              <Card className="p-4 bg-secondary/5">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Palette className="h-5 w-5 text-primary" />
                    <div>
                      <Label className="text-base font-semibold">Personalização de Cores</Label>
                      <p className="text-sm text-muted-foreground">Customize as cores do seu quiz</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Cor Primária</Label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={formData.primary_color}
                          onChange={(e) => setFormData({...formData, primary_color: e.target.value})}
                          className="h-10 w-14 rounded border cursor-pointer"
                        />
                        <Input
                          value={formData.primary_color}
                          onChange={(e) => setFormData({...formData, primary_color: e.target.value})}
                          placeholder="#8B5CF6"
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Cor Secundária</Label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={formData.secondary_color}
                          onChange={(e) => setFormData({...formData, secondary_color: e.target.value})}
                          className="h-10 w-14 rounded border cursor-pointer"
                        />
                        <Input
                          value={formData.secondary_color}
                          onChange={(e) => setFormData({...formData, secondary_color: e.target.value})}
                          placeholder="#0EA5E9"
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Captura de Dados */}
              <Card className="p-4 bg-primary/5">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-semibold">Capturar Dados do Cliente</Label>
                      <p className="text-sm text-muted-foreground">Colete informações antes de mostrar os resultados</p>
                    </div>
                    <Switch
                      checked={formData.collect_data}
                      onCheckedChange={(checked) => setFormData({...formData, collect_data: checked})}
                    />
                  </div>

                  {formData.collect_data && (
                    <div className="grid grid-cols-2 gap-3 pl-4 border-l-2 border-primary/20">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="collect_name"
                          checked={formData.collect_name}
                          onCheckedChange={(checked) => setFormData({...formData, collect_name: checked})}
                        />
                        <Label htmlFor="collect_name" className="text-sm">Nome</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="collect_email"
                          checked={formData.collect_email}
                          onCheckedChange={(checked) => setFormData({...formData, collect_email: checked})}
                        />
                        <Label htmlFor="collect_email" className="text-sm">Email</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="collect_phone"
                          checked={formData.collect_phone}
                          onCheckedChange={(checked) => setFormData({...formData, collect_phone: checked})}
                        />
                        <Label htmlFor="collect_phone" className="text-sm">Telefone</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="collect_whatsapp"
                          checked={formData.collect_whatsapp}
                          onCheckedChange={(checked) => setFormData({...formData, collect_whatsapp: checked})}
                        />
                        <Label htmlFor="collect_whatsapp" className="text-sm">WhatsApp</Label>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* Oferta no Final */}
              <Card className="p-4 bg-success/5">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Gift className="h-5 w-5 text-success" />
                      <div>
                        <Label className="text-base font-semibold">Mostrar Oferta no Final</Label>
                        <p className="text-sm text-muted-foreground">Apresente uma oferta após os resultados</p>
                      </div>
                    </div>
                    <Switch
                      checked={formData.show_offer}
                      onCheckedChange={(checked) => setFormData({...formData, show_offer: checked})}
                    />
                  </div>

                  {formData.show_offer && (
                    <div className="space-y-3 pl-4 border-l-2 border-success/20">
                      <div className="grid gap-2">
                        <Label>Título da Oferta</Label>
                        <Input 
                          value={formData.offer_title}
                          onChange={(e) => setFormData({...formData, offer_title: e.target.value})}
                          placeholder="Ex: Oferta Especial Para Você!"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Descrição da Oferta</Label>
                        <Textarea 
                          value={formData.offer_description}
                          onChange={(e) => setFormData({...formData, offer_description: e.target.value})}
                          placeholder="Descreva sua oferta..."
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-2">
                          <Label>Texto do Botão</Label>
                          <Input 
                            value={formData.offer_button_text}
                            onChange={(e) => setFormData({...formData, offer_button_text: e.target.value})}
                            placeholder="Texto do botão"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Link do Botão</Label>
                          <Input 
                            value={formData.offer_button_link}
                            onChange={(e) => setFormData({...formData, offer_button_link: e.target.value})}
                            placeholder="https://..."
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* Redirecionamento */}
              <Card className="p-4 bg-accent/5">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <LinkIcon className="h-5 w-5 text-accent" />
                    <div>
                      <Label className="text-base font-semibold">Redirecionamento Final (Opcional)</Label>
                      <p className="text-sm text-muted-foreground">Redireciona automaticamente após mostrar os resultados</p>
                    </div>
                  </div>
                  <Input 
                    value={formData.redirect_url}
                    onChange={(e) => setFormData({...formData, redirect_url: e.target.value})}
                    placeholder="https://seusite.com/obrigado"
                  />
                </div>
              </Card>

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
                          <Input 
                            key={oIndex}
                            value={option}
                            onChange={(e) => handleUpdateOption(qIndex, oIndex, e.target.value)}
                            placeholder={`Opção ${oIndex + 1}`}
                          />
                        ))}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button onClick={handleSaveQuiz} className="gradient-primary">
                {editingQuizId ? 'Atualizar Quiz' : 'Criar Quiz'}
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
                        onClick={() => setAnalyticsQuizId(quiz.id)}
                        title="Ver Analytics"
                      >
                        <PieChart className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => handleEditQuiz(quiz)}
                        title="Editar Quiz"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => window.open(`/quiz/${quiz.id}`, '_blank')}
                        title="Visualizar"
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
