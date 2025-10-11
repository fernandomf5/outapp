import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { UsersPanel } from "@/components/admin/UsersPanel";
import { SubscriptionsPanel } from "@/components/admin/SubscriptionsPanel";
import { RevenuePanel } from "@/components/admin/RevenuePanel";
import { GrowthChart } from "@/components/admin/GrowthChart";
import {
  Users,
  DollarSign,
  TrendingUp,
  Settings,
  Plus,
  Edit,
  Trash2,
  Crown,
  ArrowLeft,
  MessageSquare,
  Send,
  UserCog,
  Mail,
  Lock,
  User,
  BarChart3,
  Video,
  Bell,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Plan {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
}

interface Tutorial {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  duration: string;
  category: string;
}

const AdminDashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSubscriptions: 0,
    monthlyRevenue: 0,
    growthRate: 0,
    newUsersThisMonth: 0,
  });

  const [plans, setPlans] = useState<Plan[]>([]);

  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Tutorial | null>(null);

  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  
  // Admin Profile Settings
  const [adminProfile, setAdminProfile] = useState({
    name: "Fernando Morais Garcia",
    email: "fernandomoraisgarcia2011@gmail.com",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Broadcast Message
  const [broadcastMessage, setBroadcastMessage] = useState({
    subject: "",
    message: "",
    imageUrl: "",
  });

  // Fetch real data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      // Buscar total de usuários
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Calcular novos usuários no mês atual
      const startOfMonthIso = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const { count: newUsersThisMonth } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfMonthIso);

      // Buscar assinaturas ativas
      const { count: activeSubsCount } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Buscar planos
      const { data: plansData } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true);

      // Buscar vídeos tutoriais
      const { data: videosData } = await supabase
        .from('tutorial_videos')
        .select('*')
        .eq('is_published', true)
        .order('order_index', { ascending: true });

      // Atualizar estados
      setStats({
        totalUsers: usersCount || 0,
        activeSubscriptions: activeSubsCount || 0,
        monthlyRevenue: 0, // Calcular quando houver dados de pagamento
        growthRate: 0, // Calcular quando houver histórico
        newUsersThisMonth: newUsersThisMonth || 0,
      });

      if (plansData) {
        setPlans(plansData.map(p => ({
          id: p.id,
          name: p.name,
          price: Number(p.price),
          description: p.description || '',
          features: (p.features as any)?.features || []
        })));
      }

      if (videosData) {
        setTutorials(videosData.map(v => ({
          id: v.id,
          title: v.title,
          description: v.description || '',
          videoUrl: v.video_url,
          duration: v.duration?.toString() || '0',
          category: v.category || 'Geral'
        })));
      }
    };

    fetchData();
  }, []);

  const handleSavePlan = async () => {
    if (editingPlan) {
      if (editingPlan.id === "new") {
        const { data, error } = await supabase
          .from('plans')
          .insert([{
            name: editingPlan.name,
            price: editingPlan.price,
            description: editingPlan.description,
            plan_type: 'chatbot' as const,
            duration_days: 30,
            features: { features: editingPlan.features },
            is_active: true
          }])
          .select()
          .single();

        if (!error && data) {
          setPlans([...plans, {
            id: data.id,
            name: data.name,
            price: Number(data.price),
            description: data.description || '',
            features: (data.features as any)?.features || []
          }]);
          toast({
            title: "Plano criado! ✅",
            description: "O novo plano está disponível para os usuários.",
          });
        }
      } else {
        const { error } = await supabase
          .from('plans')
          .update({
            name: editingPlan.name,
            price: editingPlan.price,
            description: editingPlan.description,
            features: { features: editingPlan.features }
          })
          .eq('id', editingPlan.id);

        if (!error) {
          setPlans(plans.map(p => p.id === editingPlan.id ? editingPlan : p));
          toast({
            title: "Plano atualizado! ✅",
            description: "As alterações foram salvas.",
          });
        }
      }
    }
    setIsDialogOpen(false);
    setEditingPlan(null);
  };

  const handleDeletePlan = async (id: string) => {
    const { error } = await supabase
      .from('plans')
      .update({ is_active: false })
      .eq('id', id);

    if (!error) {
      setPlans(plans.filter(p => p.id !== id));
      toast({
        title: "Plano excluído",
        description: "O plano foi removido com sucesso.",
      });
    }
  };

  const createNewPlan = () => {
    setEditingPlan({
      id: "new",
      name: "",
      price: 0,
      description: "",
      features: [],
    });
    setIsDialogOpen(true);
  };

  const handleSaveSettings = () => {
    if (adminProfile.newPassword && adminProfile.newPassword !== adminProfile.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Configurações salvas! ✅",
      description: "Suas informações foram atualizadas com sucesso.",
    });
    setIsSettingsOpen(false);
  };

  const handleSendBroadcast = async () => {
    if (!broadcastMessage.subject || !broadcastMessage.message) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o assunto e a mensagem.",
        variant: "destructive",
      });
      return;
    }

    // Criar HTML a partir da mensagem com quebras de linha e links
    const contentHtml = broadcastMessage.message
      .split('\n')
      .map(line => {
        // Detectar URLs e transformar em links
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return line.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-primary underline">$1</a>');
      })
      .join('<br/>');

    // Inserir mensagem na tabela admin_messages
    const { error } = await supabase
      .from('admin_messages')
      .insert({
        title: broadcastMessage.subject,
        message: broadcastMessage.message,
        content_html: `<div>${contentHtml}</div>`,
        image_url: broadcastMessage.imageUrl || null,
        sent_to_all: true,
        is_read: false
      });

    if (error) {
      toast({
        title: "Erro ao enviar mensagem",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Mensagem enviada! 📨",
      description: `Broadcast enviado para ${stats.totalUsers} usuários.`,
    });
    setBroadcastMessage({ subject: "", message: "", imageUrl: "" });
    setIsBroadcastOpen(false);
  };

  const handleSaveVideo = async () => {
    if (editingVideo) {
      if (editingVideo.id === "new") {
        const { data, error } = await supabase
          .from('tutorial_videos')
          .insert({
            title: editingVideo.title,
            description: editingVideo.description,
            video_url: editingVideo.videoUrl,
            duration: parseInt(editingVideo.duration) || 0,
            category: editingVideo.category,
            is_published: true,
            order_index: tutorials.length
          })
          .select()
          .single();

        if (!error && data) {
          setTutorials([...tutorials, {
            id: data.id,
            title: data.title,
            description: data.description || '',
            videoUrl: data.video_url,
            duration: data.duration?.toString() || '0',
            category: data.category || 'Geral'
          }]);
          toast({
            title: "Vídeo adicionado! ✅",
            description: "O tutorial está disponível para todos os usuários.",
          });
        }
      } else {
        const { error } = await supabase
          .from('tutorial_videos')
          .update({
            title: editingVideo.title,
            description: editingVideo.description,
            video_url: editingVideo.videoUrl,
            duration: parseInt(editingVideo.duration) || 0,
            category: editingVideo.category
          })
          .eq('id', editingVideo.id);

        if (!error) {
          setTutorials(tutorials.map(t => t.id === editingVideo.id ? editingVideo : t));
          toast({
            title: "Vídeo atualizado! ✅",
            description: "As alterações foram salvas.",
          });
        }
      }
    }
    setIsVideoDialogOpen(false);
    setEditingVideo(null);
  };

  const handleDeleteVideo = async (id: string) => {
    const { error } = await supabase
      .from('tutorial_videos')
      .delete()
      .eq('id', id);

    if (!error) {
      setTutorials(tutorials.filter(t => t.id !== id));
      toast({
        title: "Vídeo removido",
        description: "O tutorial foi excluído com sucesso.",
      });
    }
  };

  const createNewVideo = () => {
    setEditingVideo({
      id: "new",
      title: "",
      description: "",
      videoUrl: "",
      duration: "",
      category: "Iniciante",
    });
    setIsVideoDialogOpen(true);
  };

  const handleLogout = async () => {
    await signOut();
    toast({ title: "Logout realizado", description: "Você saiu da conta." });
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="bg-gradient-to-r from-card via-card to-primary/5 border-b border-border/50 backdrop-blur-sm px-6 py-4 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-warning/20 to-warning/10 p-3 rounded-xl shadow-glow animate-pulse">
              <Crown className="w-8 h-8 text-warning" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                Painel Master Admin
              </h1>
              <p className="text-sm text-muted-foreground">Controle total da plataforma</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setIsBroadcastOpen(true)} className="hover:bg-primary/10 hover:border-primary transition-all">
              <MessageSquare className="w-4 h-4 mr-2" />
              Mensagens
            </Button>
            <Button variant="outline" onClick={() => setIsSettingsOpen(true)} className="hover:bg-primary/10 hover:border-primary transition-all">
              <Settings className="w-4 h-4 mr-2" />
              Configurações
            </Button>
            <Button variant="ghost" onClick={handleLogout} className="hover:bg-destructive/10 text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 hover-scale transition-smooth bg-gradient-to-br from-card to-primary/5 border-primary/20 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-br from-primary/20 to-primary/10 p-3 rounded-xl shadow-glow">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <span className="text-sm font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">+{stats.newUsersThisMonth} este mês</span>
              </div>
              <h3 className="text-3xl font-bold mb-1 text-success">{stats.totalUsers}</h3>
              <p className="text-muted-foreground">Usuários Totais</p>
            </div>
          </Card>

          <Card className="p-6 hover-scale transition-smooth bg-gradient-to-br from-card to-success/5 border-success/20 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-success/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-br from-success/20 to-success/10 p-3 rounded-xl shadow-glow">
                  <TrendingUp className="w-6 h-6 text-success" />
                </div>
                <span className="text-sm font-semibold text-success bg-success/10 px-3 py-1 rounded-full">Ativo</span>
              </div>
              <h3 className="text-3xl font-bold mb-1 text-success">{stats.activeSubscriptions}</h3>
              <p className="text-muted-foreground">Assinaturas Ativas</p>
            </div>
          </Card>

          <Card className="p-6 hover-scale transition-smooth bg-gradient-to-br from-card to-warning/5 border-warning/20 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-warning/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-br from-warning/20 to-warning/10 p-3 rounded-xl shadow-glow">
                  <DollarSign className="w-6 h-6 text-warning" />
                </div>
                <span className="text-sm font-semibold text-warning bg-warning/10 px-3 py-1 rounded-full">+{stats.growthRate}%</span>
              </div>
              <h3 className="text-3xl font-bold mb-1 text-success">R$ {stats.monthlyRevenue.toLocaleString()}</h3>
              <p className="text-muted-foreground">Receita Mensal</p>
            </div>
          </Card>

          <Card className="p-6 hover-scale transition-smooth bg-gradient-to-br from-card to-info/5 border-info/20 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-info/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-br from-info/20 to-info/10 p-3 rounded-xl shadow-glow">
                  <TrendingUp className="w-6 h-6 text-info" />
                </div>
                <span className="text-sm font-semibold text-info bg-info/10 px-3 py-1 rounded-full">Crescimento</span>
              </div>
              <h3 className="text-3xl font-bold mb-1 text-success">{stats.growthRate}%</h3>
              <p className="text-muted-foreground">Taxa de Crescimento</p>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 hover:shadow-xl hover-scale transition-smooth cursor-pointer bg-gradient-to-br from-card to-primary/5 border-primary/20 group" onClick={() => setIsBroadcastOpen(true)}>
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-primary/20 to-primary/10 p-3 rounded-xl shadow-glow group-hover:scale-110 transition-transform">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Enviar Mensagem</h3>
                <p className="text-sm text-muted-foreground">Comunicação com usuários</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-xl hover-scale transition-smooth cursor-pointer bg-gradient-to-br from-card to-info/5 border-info/20 group">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-info/20 to-info/10 p-3 rounded-xl shadow-glow group-hover:scale-110 transition-transform">
                <BarChart3 className="w-6 h-6 text-info" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Relatórios</h3>
                <p className="text-sm text-muted-foreground">Analytics detalhados</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-xl hover-scale transition-smooth cursor-pointer bg-gradient-to-br from-card to-warning/5 border-warning/20 group" onClick={() => setIsVideoDialogOpen(true)}>
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-warning/20 to-warning/10 p-3 rounded-xl shadow-glow group-hover:scale-110 transition-transform">
                <Video className="w-6 h-6 text-warning" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Vídeos Tutoriais</h3>
                <p className="text-sm text-muted-foreground">Gerenciar conteúdo</p>
              </div>
            </div>
          </Card>
        </div>

        {/* New Admin Panels */}
        <div className="space-y-6 mb-8">
          <GrowthChart />
          
          <div className="grid md:grid-cols-2 gap-6">
            <UsersPanel />
            <SubscriptionsPanel />
          </div>
          
          <RevenuePanel />
        </div>

        {/* Video Tutorials Management */}
        <Card className="p-6 mb-8 bg-gradient-to-br from-card via-card to-warning/5 border-warning/20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">Vídeos Tutoriais</h2>
            <Button onClick={createNewVideo} className="gradient-primary shadow-glow hover-scale">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Vídeo
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {tutorials.map((tutorial) => (
              <Card key={tutorial.id} className="p-5 hover:shadow-lg transition-smooth bg-gradient-to-br from-background to-warning/5 border-warning/10">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-warning/20 to-warning/10 p-2 rounded-lg">
                      <Video className="w-5 h-5 text-warning" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">{tutorial.title}</h3>
                      <div className="flex gap-2 mt-1">
                        <span className="text-xs bg-warning/10 text-warning px-2 py-0.5 rounded-full">{tutorial.category}</span>
                        <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{tutorial.duration}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingVideo(tutorial);
                        setIsVideoDialogOpen(true);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteVideo(tutorial.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-3">{tutorial.description}</p>
                
                <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                  <iframe
                    src={tutorial.videoUrl.replace('watch?v=', 'embed/')}
                    className="w-full h-full"
                    allowFullScreen
                    title={tutorial.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                </div>
              </Card>
            ))}
          </div>
        </Card>

        {/* Plans Management */}
        <Card className="p-6 mb-8 bg-gradient-to-br from-card via-card to-primary/5 border-primary/20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">Gerenciar Planos</h2>
            <Button onClick={createNewPlan} className="gradient-primary shadow-glow hover-scale">
              <Plus className="w-4 h-4 mr-2" />
              Criar Novo Plano
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card key={plan.id} className="p-6 hover:shadow-xl hover-scale transition-smooth bg-gradient-to-br from-background to-primary/5 border-primary/10 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                      <p className="text-3xl font-bold text-success">
                        R$ {plan.price.toFixed(2)}
                        <span className="text-sm text-muted-foreground font-normal">/mês</span>
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingPlan(plan);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeletePlan(plan.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  <p className="text-muted-foreground mb-4">{plan.description}</p>

                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 bg-gradient-to-r from-primary to-success rounded-full shadow-glow"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            ))}
          </div>
        </Card>

        {/* Kiwify Integration */}
        <Card className="p-6 bg-gradient-to-br from-card via-card to-success/5 border-success/20">
          <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-foreground to-success bg-clip-text text-transparent">Integração Kiwify</h2>
          <p className="text-muted-foreground mb-6">
            Configure a integração com a Kiwify para gerenciar pagamentos e afiliados
          </p>

          <div className="space-y-4 max-w-2xl">
            <div>
              <Label htmlFor="kiwify-token">Token de API da Kiwify</Label>
              <Input id="kiwify-token" placeholder="Cole seu token aqui" />
            </div>

            <div>
              <Label htmlFor="kiwify-webhook">URL do Webhook</Label>
              <Input
                id="kiwify-webhook"
                value="https://seu-app.com/webhooks/kiwify"
                readOnly
              />
              <p className="text-xs text-muted-foreground mt-1">
                Cole esta URL nas configurações de webhook da Kiwify
              </p>
            </div>

            <Button className="gradient-primary shadow-glow hover-scale">
              Salvar Configurações
            </Button>
          </div>
        </Card>
      </main>

      {/* Video Tutorial Dialog */}
      <Dialog open={isVideoDialogOpen} onOpenChange={setIsVideoDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="w-5 h-5" />
              {editingVideo?.id === "new" ? "Adicionar Novo Vídeo Tutorial" : "Editar Vídeo Tutorial"}
            </DialogTitle>
          </DialogHeader>

          {editingVideo && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="video-title">Título do Vídeo</Label>
                <Input
                  id="video-title"
                  value={editingVideo.title}
                  onChange={(e) =>
                    setEditingVideo({ ...editingVideo, title: e.target.value })
                  }
                  placeholder="Ex: Como criar seu primeiro chatbot"
                />
              </div>

              <div>
                <Label htmlFor="video-description">Descrição</Label>
                <Textarea
                  id="video-description"
                  value={editingVideo.description}
                  onChange={(e) =>
                    setEditingVideo({ ...editingVideo, description: e.target.value })
                  }
                  placeholder="Descreva sobre o que é o vídeo..."
                  className="min-h-[100px]"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="video-category">Categoria</Label>
                  <Input
                    id="video-category"
                    value={editingVideo.category}
                    onChange={(e) =>
                      setEditingVideo({ ...editingVideo, category: e.target.value })
                    }
                    placeholder="Ex: Iniciante, Intermediário"
                  />
                </div>

                <div>
                  <Label htmlFor="video-duration">Duração</Label>
                  <Input
                    id="video-duration"
                    value={editingVideo.duration}
                    onChange={(e) =>
                      setEditingVideo({ ...editingVideo, duration: e.target.value })
                    }
                    placeholder="Ex: 5:30"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="video-url">URL do Vídeo (YouTube Embed)</Label>
                <Input
                  id="video-url"
                  value={editingVideo.videoUrl}
                  onChange={(e) =>
                    setEditingVideo({ ...editingVideo, videoUrl: e.target.value })
                  }
                  placeholder="https://www.youtube.com/embed/..."
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Use o formato de embed do YouTube: https://www.youtube.com/embed/VIDEO_ID
                </p>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <Button variant="outline" onClick={() => setIsVideoDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveVideo} className="gradient-primary">
                  {editingVideo.id === "new" ? "Adicionar Vídeo" : "Salvar Alterações"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCog className="w-5 h-5" />
              Configurações do Perfil Admin
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="admin-name">Nome Completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="admin-name"
                    value={adminProfile.name}
                    onChange={(e) =>
                      setAdminProfile({ ...adminProfile, name: e.target.value })
                    }
                    className="pl-10"
                    placeholder="Seu nome completo"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="admin-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="admin-email"
                    type="email"
                    value={adminProfile.email}
                    onChange={(e) =>
                      setAdminProfile({ ...adminProfile, email: e.target.value })
                    }
                    className="pl-10"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Alterar Senha
              </h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="current-password">Senha Atual</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={adminProfile.currentPassword}
                    onChange={(e) =>
                      setAdminProfile({ ...adminProfile, currentPassword: e.target.value })
                    }
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <Label htmlFor="new-password">Nova Senha</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={adminProfile.newPassword}
                    onChange={(e) =>
                      setAdminProfile({ ...adminProfile, newPassword: e.target.value })
                    }
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={adminProfile.confirmPassword}
                    onChange={(e) =>
                      setAdminProfile({ ...adminProfile, confirmPassword: e.target.value })
                    }
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveSettings} className="gradient-primary">
                Salvar Alterações
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Broadcast Message Dialog */}
      <Dialog open={isBroadcastOpen} onOpenChange={setIsBroadcastOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Enviar Mensagem para Todos os Usuários
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-info/10 border border-info/20 rounded-lg p-4 flex items-start gap-3">
              <Bell className="w-5 h-5 text-info mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-info mb-1">Atenção!</p>
                <p className="text-muted-foreground">
                  Esta mensagem será enviada para todos os {stats.totalUsers} usuários cadastrados na plataforma.
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="broadcast-subject">Assunto</Label>
              <Input
                id="broadcast-subject"
                value={broadcastMessage.subject}
                onChange={(e) =>
                  setBroadcastMessage({ ...broadcastMessage, subject: e.target.value })
                }
                placeholder="Ex: Novidades na plataforma!"
              />
            </div>

            <div>
              <Label htmlFor="broadcast-message">Mensagem</Label>
              <Textarea
                id="broadcast-message"
                value={broadcastMessage.message}
                onChange={(e) =>
                  setBroadcastMessage({ ...broadcastMessage, message: e.target.value })
                }
                placeholder="Digite sua mensagem aqui... Use quebras de linha e inclua URLs que serão automaticamente convertidos em links."
                className="min-h-[150px]"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {broadcastMessage.message.length} caracteres. URLs serão convertidos em links clicáveis automaticamente.
              </p>
            </div>

            <div>
              <Label htmlFor="broadcast-image">URL da Imagem (opcional)</Label>
              <Input
                id="broadcast-image"
                type="url"
                value={broadcastMessage.imageUrl}
                onChange={(e) =>
                  setBroadcastMessage({ ...broadcastMessage, imageUrl: e.target.value })
                }
                placeholder="https://exemplo.com/imagem.jpg"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Adicione uma imagem à sua mensagem
              </p>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button variant="outline" onClick={() => setIsBroadcastOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSendBroadcast} className="gradient-primary">
                <Send className="w-4 h-4 mr-2" />
                Enviar para Todos
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Plan Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingPlan?.id === "new" ? "Criar Novo Plano" : "Editar Plano"}
            </DialogTitle>
          </DialogHeader>

          {editingPlan && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="plan-name">Nome do Plano</Label>
                <Input
                  id="plan-name"
                  value={editingPlan.name}
                  onChange={(e) =>
                    setEditingPlan({ ...editingPlan, name: e.target.value })
                  }
                  placeholder="Ex: Plano Premium"
                />
              </div>

              <div>
                <Label htmlFor="plan-price">Preço (R$)</Label>
                <Input
                  id="plan-price"
                  type="number"
                  step="0.01"
                  value={editingPlan.price}
                  onChange={(e) =>
                    setEditingPlan({ ...editingPlan, price: parseFloat(e.target.value) })
                  }
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="plan-description">Descrição</Label>
                <Input
                  id="plan-description"
                  value={editingPlan.description}
                  onChange={(e) =>
                    setEditingPlan({ ...editingPlan, description: e.target.value })
                  }
                  placeholder="Breve descrição do plano"
                />
              </div>

              <div>
                <Label>Recursos (um por linha)</Label>
                <textarea
                  className="w-full min-h-[120px] p-3 rounded-md border border-input bg-background"
                  value={editingPlan.features.join("\n")}
                  onChange={(e) =>
                    setEditingPlan({
                      ...editingPlan,
                      features: e.target.value.split("\n").filter((f) => f.trim()),
                    })
                  }
                  placeholder="Recurso 1&#10;Recurso 2&#10;Recurso 3"
                />
              </div>

              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSavePlan} className="gradient-primary">
                  Salvar Plano
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
