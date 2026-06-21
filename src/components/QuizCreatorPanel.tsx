import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Palette,
  HelpCircle,
  Plus,
  Eye,
  Trash2,
  Edit,
  Copy,
  BarChart3,
  CheckCircle2,
  Gift,
  Link as LinkIcon,
  PieChart,
  Target,
  Sparkles,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { QuizAnalyticsPanel } from "./QuizAnalyticsPanel";

interface QuizOption {
  text: string;
  points: number;
  profile_id?: string;
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
  title: string;
  description?: string;
  questions: QuizQuestion[];
  is_active: boolean;
  responses_count: number;
  created_at: string;
}

const uid = () =>
  (globalThis.crypto?.randomUUID?.() ??
    Math.random().toString(36).slice(2) + Date.now().toString(36));

const normalizeOptions = (opts: any[]): QuizOption[] => {
  if (!Array.isArray(opts)) return [];
  return opts.map((o) =>
    typeof o === "string"
      ? { text: o, points: 0, profile_id: "" }
      : {
          text: String(o?.text ?? ""),
          points: Number(o?.points ?? 0),
          profile_id: String(o?.profile_id ?? ""),
        }
  );
};

const normalizeQuestions = (qs: any): QuizQuestion[] => {
  if (!Array.isArray(qs)) return [];
  return qs.map((q) => ({
    question: String(q?.question ?? ""),
    options: normalizeOptions(q?.options ?? []),
  }));
};

const emptyQuestion = (): QuizQuestion => ({
  question: "",
  options: Array.from({ length: 4 }, () => ({ text: "", points: 0, profile_id: "" })),
});

const emptyProfile = (): ResultProfile => ({
  id: uid(),
  name: "Novo perfil",
  min_score: 0,
  max_score: 10,
  title: "",
  description: "",
  image_url: "",
  video_url: "",
  offers: [],
});

const emptyOffer = (): QuizOffer => ({
  id: uid(),
  title: "",
  description: "",
  image_url: "",
  button_text: "Quero essa oferta!",
  button_link: "",
});

export const QuizCreatorPanel = () => {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [analyticsQuizId, setAnalyticsQuizId] = useState<string | null>(null);
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null);

  const initialFormData = {
    title: "",
    description: "",
    primary_color: "#8B5CF6",
    secondary_color: "#0EA5E9",
    collect_data: false,
    collect_name: true,
    collect_email: true,
    collect_phone: false,
    collect_whatsapp: false,
    send_to_crm: true,
    show_offer: false,
    offer_title: "",
    offer_description: "",
    offer_button_text: "Quero essa oferta!",
    offer_button_link: "",
    redirect_url: "",
    questions: [emptyQuestion()] as QuizQuestion[],
    result_profiles: [] as ResultProfile[],
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
        .from("quizzes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setQuizzes((data as any) || []);
    } catch {
      toast.error("Erro ao carregar quizzes");
    } finally {
      setLoading(false);
    }
  };

  // ---------- Questions ----------
  const handleAddQuestion = () =>
    setFormData({ ...formData, questions: [...formData.questions, emptyQuestion()] });

  const handleRemoveQuestion = (index: number) =>
    setFormData({
      ...formData,
      questions: formData.questions.filter((_, i) => i !== index),
    });

  const handleDuplicateQuestion = (index: number) => {
    const q = formData.questions[index];
    const copy: QuizQuestion = {
      question: q.question,
      options: q.options.map((o) => ({ ...o })),
    };
    const newQs = [...formData.questions];
    newQs.splice(index + 1, 0, copy);
    setFormData({ ...formData, questions: newQs });
  };

  const handleUpdateQuestion = (index: number, field: keyof QuizQuestion, value: any) => {
    const newQs = [...formData.questions];
    (newQs[index] as any)[field] = value;
    setFormData({ ...formData, questions: newQs });
  };

  const handleUpdateOption = (
    qIndex: number,
    oIndex: number,
    field: keyof QuizOption,
    value: any
  ) => {
    const newQs = [...formData.questions];
    const opts = [...newQs[qIndex].options];
    opts[oIndex] = {
      ...opts[oIndex],
      [field]: field === "points" ? Number(value) || 0 : value,
    };
    newQs[qIndex] = { ...newQs[qIndex], options: opts };
    setFormData({ ...formData, questions: newQs });
  };

  const handleAddOption = (qIndex: number) => {
    const newQs = [...formData.questions];
    newQs[qIndex] = {
      ...newQs[qIndex],
      options: [...newQs[qIndex].options, { text: "", points: 0, profile_id: "" }],
    };
    setFormData({ ...formData, questions: newQs });
  };

  const handleRemoveOption = (qIndex: number, oIndex: number) => {
    const newQs = [...formData.questions];
    newQs[qIndex] = {
      ...newQs[qIndex],
      options: newQs[qIndex].options.filter((_, i) => i !== oIndex),
    };
    setFormData({ ...formData, questions: newQs });
  };

  // ---------- Result Profiles ----------
  const handleAddProfile = () =>
    setFormData({ ...formData, result_profiles: [...formData.result_profiles, emptyProfile()] });

  const handleUpdateProfile = (pIndex: number, field: keyof ResultProfile, value: any) => {
    const arr = [...formData.result_profiles];
    (arr[pIndex] as any)[field] = ["min_score", "max_score"].includes(field as string)
      ? Number(value) || 0
      : value;
    setFormData({ ...formData, result_profiles: arr });
  };

  const handleRemoveProfile = (pIndex: number) =>
    setFormData({
      ...formData,
      result_profiles: formData.result_profiles.filter((_, i) => i !== pIndex),
    });

  const handleAddOffer = (pIndex: number) => {
    const arr = [...formData.result_profiles];
    arr[pIndex] = { ...arr[pIndex], offers: [...arr[pIndex].offers, emptyOffer()] };
    setFormData({ ...formData, result_profiles: arr });
  };

  const handleUpdateOffer = (
    pIndex: number,
    oIndex: number,
    field: keyof QuizOffer,
    value: any
  ) => {
    const arr = [...formData.result_profiles];
    const offers = [...arr[pIndex].offers];
    offers[oIndex] = { ...offers[oIndex], [field]: value };
    arr[pIndex] = { ...arr[pIndex], offers };
    setFormData({ ...formData, result_profiles: arr });
  };

  const handleRemoveOffer = (pIndex: number, oIndex: number) => {
    const arr = [...formData.result_profiles];
    arr[pIndex] = {
      ...arr[pIndex],
      offers: arr[pIndex].offers.filter((_, i) => i !== oIndex),
    };
    setFormData({ ...formData, result_profiles: arr });
  };

  // ---------- Save / Edit ----------
  const handleEditQuiz = async (quiz: Quiz) => {
    const { data, error } = await supabase
      .from("quizzes")
      .select("*")
      .eq("id", quiz.id)
      .single();

    if (error || !data) {
      toast.error("Erro ao carregar quiz");
      return;
    }
    const d: any = data;
    setFormData({
      title: d.title || "",
      description: d.description || "",
      primary_color: d.primary_color || "#8B5CF6",
      secondary_color: d.secondary_color || "#0EA5E9",
      collect_data: d.collect_data || false,
      collect_name: d.collect_name ?? true,
      collect_email: d.collect_email ?? true,
      collect_phone: d.collect_phone || false,
      collect_whatsapp: d.collect_whatsapp || false,
      send_to_crm: d.send_to_crm ?? true,
      show_offer: d.show_offer || false,
      offer_title: d.offer_title || "",
      offer_description: d.offer_description || "",
      offer_button_text: d.offer_button_text || "Quero essa oferta!",
      offer_button_link: d.offer_button_link || "",
      redirect_url: d.redirect_url || "",
      questions: normalizeQuestions(d.questions).length
        ? normalizeQuestions(d.questions)
        : [emptyQuestion()],
      result_profiles: Array.isArray(d.result_profiles)
        ? (d.result_profiles as ResultProfile[]).map((p) => ({
            ...p,
            id: p.id || uid(),
            offers: (p.offers || []).map((o) => ({ ...o, id: o.id || uid() })),
          }))
        : [],
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

      const quizData: any = {
        title: formData.title,
        description: formData.description,
        primary_color: formData.primary_color,
        secondary_color: formData.secondary_color,
        questions: formData.questions,
        result_profiles: formData.result_profiles,
        send_to_crm: formData.send_to_crm,
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
        const { error } = await supabase.from("quizzes").update(quizData).eq("id", editingQuizId);
        if (error) throw error;
        toast.success("Quiz atualizado!");
      } else {
        const { error } = await supabase
          .from("quizzes")
          .insert([{ ...quizData, user_id: user.id, is_active: true, responses_count: 0 }]);
        if (error) throw error;
        toast.success("Quiz criado!");
      }

      setIsAddDialogOpen(false);
      setEditingQuizId(null);
      setFormData(initialFormData);
      loadQuizzes();
    } catch {
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
      const { error } = await supabase.from("quizzes").delete().eq("id", id);
      if (error) throw error;
      toast.success("Quiz excluído!");
      loadQuizzes();
    } catch {
      toast.error("Erro ao excluir quiz");
    }
  };

  const handleCopyLink = (quizId: string) => {
    const link = `${window.location.origin}/quiz/${quizId}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copiado!");
  };

  const totalResponses = quizzes.reduce((sum, q) => sum + q.responses_count, 0);
  const totalQuestions = quizzes.reduce(
    (sum, q) => sum + (q.questions?.length || 0),
    0
  );

  if (analyticsQuizId) {
    return (
      <QuizAnalyticsPanel quizId={analyticsQuizId} onBack={() => setAnalyticsQuizId(null)} />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Criador de Quiz</h2>
          <p className="text-muted-foreground">
            Quizzes inteligentes com pontuação, perfis e ofertas personalizadas
          </p>
        </div>
        <Button
          className="gradient-primary shadow-glow"
          onClick={() => {
            setEditingQuizId(null);
            setFormData(initialFormData);
            setIsAddDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Criar Quiz
        </Button>

        <Dialog open={isAddDialogOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
          <DialogContent className="sm:max-w-[760px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingQuizId ? "Editar Quiz" : "Criar Novo Quiz"}</DialogTitle>
              <DialogDescription>
                Configure perguntas com pontuação, perfis de resultado e ofertas
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Título do Quiz</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Descubra seu perfil de emagrecimento"
                />
              </div>
              <div className="grid gap-2">
                <Label>Descrição</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                />
              </div>

              {/* Cores */}
              <Card className="p-4 bg-secondary/5">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Palette className="h-5 w-5 text-primary" />
                    <Label className="text-base font-semibold">Cores</Label>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {(["primary_color", "secondary_color"] as const).map((k, i) => (
                      <div key={k} className="space-y-2">
                        <Label>{i === 0 ? "Primária" : "Secundária"}</Label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={(formData as any)[k]}
                            onChange={(e) => setFormData({ ...formData, [k]: e.target.value })}
                            className="h-10 w-14 rounded border cursor-pointer"
                          />
                          <Input
                            value={(formData as any)[k]}
                            onChange={(e) => setFormData({ ...formData, [k]: e.target.value })}
                            className="flex-1"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              {/* Captura */}
              <Card className="p-4 bg-primary/5">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-semibold">Capturar dados do lead</Label>
                      <p className="text-sm text-muted-foreground">
                        Pede dados antes de mostrar o resultado
                      </p>
                    </div>
                    <Switch
                      checked={formData.collect_data}
                      onCheckedChange={(v) => setFormData({ ...formData, collect_data: v })}
                    />
                  </div>
                  {formData.collect_data && (
                    <>
                      <div className="grid grid-cols-2 gap-3 pl-4 border-l-2 border-primary/20">
                        {(
                          [
                            ["collect_name", "Nome"],
                            ["collect_email", "Email"],
                            ["collect_phone", "Telefone"],
                            ["collect_whatsapp", "WhatsApp"],
                          ] as const
                        ).map(([k, label]) => (
                          <div key={k} className="flex items-center space-x-2">
                            <Switch
                              id={k}
                              checked={(formData as any)[k]}
                              onCheckedChange={(v) => setFormData({ ...formData, [k]: v })}
                            />
                            <Label htmlFor={k} className="text-sm">
                              {label}
                            </Label>
                          </div>
                        ))}
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm font-medium">
                            Enviar lead ao Controle de Leads (Cadastro)
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Cria o contato automaticamente com origem do quiz
                          </p>
                        </div>
                        <Switch
                          checked={formData.send_to_crm}
                          onCheckedChange={(v) =>
                            setFormData({ ...formData, send_to_crm: v })
                          }
                        />
                      </div>
                    </>
                  )}
                </div>
              </Card>

              {/* Perfis de Resultado */}
              <Card className="p-4 bg-accent/5">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-accent" />
                      <div>
                        <Label className="text-base font-semibold">
                          Perfis de Resultado (ofertas por resposta)
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Crie os perfis aqui e, em cada opção de pergunta, escolha para qual perfil ela direciona
                        </p>
                      </div>
                    </div>
                    <Button type="button" size="sm" variant="outline" onClick={handleAddProfile}>
                      <Plus className="h-3 w-3 mr-1" /> Perfil
                    </Button>
                  </div>

                  {formData.result_profiles.length === 0 && (
                    <div className="text-sm text-muted-foreground border border-dashed rounded-md p-4 text-center">
                      <Sparkles className="h-5 w-5 mx-auto mb-1 opacity-60" />
                      Sem perfis configurados — o quiz mostrará a oferta única (se ativa).
                    </div>
                  )}

                  {formData.result_profiles.map((profile, pIdx) => (
                    <Card key={profile.id} className="p-3 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="outline">Perfil {pIdx + 1}</Badge>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => handleRemoveProfile(pIdx)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="md:col-span-3 grid gap-2">
                          <Label>Nome interno</Label>
                          <Input
                            value={profile.name}
                            onChange={(e) => handleUpdateProfile(pIdx, "name", e.target.value)}
                            placeholder="Ex: Iniciante"
                          />
                        </div>
                        <div className="grid gap-2 md:col-span-3">
                          <Label>Título exibido</Label>
                          <Input
                            value={profile.title}
                            onChange={(e) =>
                              handleUpdateProfile(pIdx, "title", e.target.value)
                            }
                            placeholder="Ex: Você está começando sua jornada"
                          />
                        </div>
                        <div className="grid gap-2 md:col-span-3">
                          <Label>Descrição</Label>
                          <Textarea
                            value={profile.description}
                            onChange={(e) =>
                              handleUpdateProfile(pIdx, "description", e.target.value)
                            }
                            rows={3}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Imagem (URL)</Label>
                          <Input
                            value={profile.image_url || ""}
                            onChange={(e) =>
                              handleUpdateProfile(pIdx, "image_url", e.target.value)
                            }
                            placeholder="https://..."
                          />
                        </div>
                        <div className="grid gap-2 md:col-span-2">
                          <Label>Vídeo (URL embed YouTube/Vimeo)</Label>
                          <Input
                            value={profile.video_url || ""}
                            onChange={(e) =>
                              handleUpdateProfile(pIdx, "video_url", e.target.value)
                            }
                            placeholder="https://www.youtube.com/embed/..."
                          />
                        </div>
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold">Ofertas deste perfil</Label>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleAddOffer(pIdx)}
                        >
                          <Plus className="h-3 w-3 mr-1" /> Oferta
                        </Button>
                      </div>

                      {profile.offers.map((offer, oIdx) => (
                        <Card key={offer.id} className="p-3 bg-muted/30 space-y-2">
                          <div className="flex items-center justify-between">
                            <Badge variant="secondary">Oferta {oIdx + 1}</Badge>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={() => handleRemoveOffer(pIdx, oIdx)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                          <Input
                            value={offer.title}
                            onChange={(e) =>
                              handleUpdateOffer(pIdx, oIdx, "title", e.target.value)
                            }
                            placeholder="Título da oferta"
                          />
                          <Textarea
                            value={offer.description}
                            onChange={(e) =>
                              handleUpdateOffer(pIdx, oIdx, "description", e.target.value)
                            }
                            placeholder="Descrição..."
                            rows={2}
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              value={offer.button_text}
                              onChange={(e) =>
                                handleUpdateOffer(pIdx, oIdx, "button_text", e.target.value)
                              }
                              placeholder="Texto do botão"
                            />
                            <Input
                              value={offer.button_link}
                              onChange={(e) =>
                                handleUpdateOffer(pIdx, oIdx, "button_link", e.target.value)
                              }
                              placeholder="https://link..."
                            />
                          </div>
                          <Input
                            value={offer.image_url || ""}
                            onChange={(e) =>
                              handleUpdateOffer(pIdx, oIdx, "image_url", e.target.value)
                            }
                            placeholder="URL da imagem (opcional)"
                          />
                        </Card>
                      ))}
                    </Card>
                  ))}
                </div>
              </Card>

              {/* Oferta única (fallback) */}
              <Card className="p-4 bg-success/5">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Gift className="h-5 w-5 text-success" />
                      <div>
                        <Label className="text-base font-semibold">
                          Oferta única (fallback)
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Usada quando nenhum perfil corresponde à pontuação
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={formData.show_offer}
                      onCheckedChange={(v) => setFormData({ ...formData, show_offer: v })}
                    />
                  </div>
                  {formData.show_offer && (
                    <div className="space-y-3 pl-4 border-l-2 border-success/20">
                      <Input
                        value={formData.offer_title}
                        onChange={(e) =>
                          setFormData({ ...formData, offer_title: e.target.value })
                        }
                        placeholder="Título da oferta"
                      />
                      <Textarea
                        value={formData.offer_description}
                        onChange={(e) =>
                          setFormData({ ...formData, offer_description: e.target.value })
                        }
                        placeholder="Descrição..."
                        rows={3}
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          value={formData.offer_button_text}
                          onChange={(e) =>
                            setFormData({ ...formData, offer_button_text: e.target.value })
                          }
                          placeholder="Texto do botão"
                        />
                        <Input
                          value={formData.offer_button_link}
                          onChange={(e) =>
                            setFormData({ ...formData, offer_button_link: e.target.value })
                          }
                          placeholder="https://..."
                        />
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
                    <Label className="text-base font-semibold">
                      Redirecionamento final (opcional)
                    </Label>
                  </div>
                  <Input
                    value={formData.redirect_url}
                    onChange={(e) =>
                      setFormData({ ...formData, redirect_url: e.target.value })
                    }
                    placeholder="https://seusite.com/obrigado"
                  />
                </div>
              </Card>

              {/* Perguntas */}
              <div className="space-y-4 mt-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Perguntas</h3>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddQuestion}>
                    <Plus className="mr-2 h-3 w-3" />
                    Adicionar pergunta
                  </Button>
                </div>

                {formData.questions.map((question, qIndex) => (
                  <Card key={qIndex} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">Pergunta {qIndex + 1}</Badge>
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDuplicateQuestion(qIndex)}
                            title="Duplicar"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
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
                      </div>

                      <Input
                        value={question.question}
                        onChange={(e) =>
                          handleUpdateQuestion(qIndex, "question", e.target.value)
                        }
                        placeholder="Digite sua pergunta"
                      />

                      <div className="grid gap-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs text-muted-foreground">
                            Opções (cada uma com pontuação)
                          </Label>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => handleAddOption(qIndex)}
                          >
                            <Plus className="h-3 w-3 mr-1" /> Opção
                          </Button>
                        </div>
                        {question.options.map((option, oIndex) => (
                          <div key={oIndex} className="flex gap-2 items-center">
                            <Input
                              value={option.text}
                              onChange={(e) =>
                                handleUpdateOption(qIndex, oIndex, "text", e.target.value)
                              }
                              placeholder={`Opção ${oIndex + 1}`}
                              className="flex-1"
                            />
                            <Input
                              type="number"
                              value={option.points}
                              onChange={(e) =>
                                handleUpdateOption(qIndex, oIndex, "points", e.target.value)
                              }
                              className="w-20"
                              title="Pontos"
                            />
                            {question.options.length > 1 && (
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                onClick={() => handleRemoveOption(qIndex, oIndex)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
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
                {editingQuizId ? "Atualizar Quiz" : "Criar Quiz"}
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
              {quizzes.filter((q) => q.is_active).length} ativos
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
              <p className="text-muted-foreground mb-4">Nenhum quiz criado ainda</p>
              <Button
                onClick={() => setIsAddDialogOpen(true)}
                className="gradient-primary"
              >
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
                        <Badge
                          variant={quiz.is_active ? "default" : "secondary"}
                          className="mt-2"
                        >
                          {quiz.is_active ? "Ativo" : "Inativo"}
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
                        <p className="font-semibold text-success">
                          {quiz.responses_count}
                        </p>
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
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => window.open(`/quiz/${quiz.id}`, "_blank")}
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
