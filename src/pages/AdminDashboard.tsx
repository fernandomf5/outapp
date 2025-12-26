import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useTheme } from "next-themes";
import { LanguageSelector } from "@/components/LanguageSelector";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { UsersPanel } from "@/components/admin/UsersPanel";
import { AdminsPanel } from "@/components/admin/AdminsPanel";
import { SubscriptionsPanel } from "@/components/admin/SubscriptionsPanel";
import { RevenueChartPanel } from "@/components/admin/RevenueChartPanel";
import { GrowthChart } from "@/components/admin/GrowthChart";
import { PageCreator } from "@/components/admin/PageCreator";
import { SiteSettingsManager } from "@/components/admin/SiteSettingsManager";
import { AdminMessagesManager } from "@/components/admin/AdminMessagesManager";
import { VouchersManager } from "@/components/admin/VouchersManager";
import { DiscountCouponsManager } from "@/components/admin/DiscountCouponsManager";
import { TicketsManager } from "@/components/admin/TicketsManager";
import { TicketNotificationBell } from "@/components/TicketNotificationBell";
import { LandingPageEditor } from "@/components/admin/LandingPageEditor";
import { FAQEditor } from "@/components/admin/FAQEditor";
import { LandingFeaturesEditor } from "@/components/admin/LandingFeaturesEditor";
import { MercadoPagoIntegration } from "@/components/admin/MercadoPagoIntegration";
import { AdminSecurityPanel } from "@/components/admin/AdminSecurityPanel";
import { PlanFeaturesManager } from "@/components/admin/PlanFeaturesManager";
import { BlogManager } from "@/components/admin/BlogManager";
import { BlogSettingsManager } from "@/components/admin/BlogSettingsManager";
import { FeaturesManager } from "@/components/admin/FeaturesManager";
import { FeatureOverridesManager } from "@/components/admin/FeatureOverridesManager";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { NewUserNotifications } from "@/components/admin/NewUserNotifications";
import { OnlineUsersPanel } from "@/components/admin/OnlineUsersPanel";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Users,
  DollarSign,
  TrendingUp,
  Settings,
  Plus,
  Edit,
  Trash2,
  Crown,
  Shield,
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
  Search,
  X,
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
  order_index?: number;
  plan_type: 'free' | 'monthly' | 'annual' | 'lifetime';
  duration_days: number | null;
  countdown_enabled?: boolean;
  countdown_ends_at?: string | null;
  limited_offer_banner?: string | null;
  is_visible?: boolean;
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
  const [searchParams] = useSearchParams();
  const currentSection = searchParams.get('section') || 'overview';
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
    title: "",
    message: "",
    imageUrl: "",
    sendToAll: true,
    selectedUserId: "",
  });
  
  const [userSearch, setUserSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

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
        .eq('is_active', true)
        .order('order_index', { ascending: true });

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
          features: Array.isArray(p.features) ? p.features as string[] : [],
          order_index: p.order_index || 0,
          plan_type: (p.plan_type as 'free' | 'monthly' | 'annual' | 'lifetime') || 'monthly',
          duration_days: p.duration_days || 30,
          countdown_enabled: p.countdown_enabled || false,
          countdown_ends_at: p.countdown_ends_at || null,
          limited_offer_banner: p.limited_offer_banner || null,
          is_visible: p.is_visible !== false
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
            plan_type: editingPlan.plan_type,
            duration_days: editingPlan.duration_days,
            features: editingPlan.features,
            order_index: editingPlan.order_index ?? plans.length,
            is_active: true,
            countdown_enabled: editingPlan.countdown_enabled,
            countdown_ends_at: editingPlan.countdown_ends_at,
            limited_offer_banner: editingPlan.limited_offer_banner,
            is_visible: editingPlan.is_visible !== false
          }])
          .select()
          .single();

        if (!error && data) {
          setPlans([...plans, {
            id: data.id,
            name: data.name,
            price: Number(data.price),
            description: data.description || '',
            features: Array.isArray(data.features) ? data.features as string[] : [],
            order_index: data.order_index || 0,
            plan_type: (data.plan_type as 'free' | 'monthly' | 'annual' | 'lifetime') || 'monthly',
            duration_days: data.duration_days || 30,
            countdown_enabled: data.countdown_enabled || false,
            countdown_ends_at: data.countdown_ends_at || null,
            limited_offer_banner: data.limited_offer_banner || null,
            is_visible: data.is_visible !== false
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
            features: editingPlan.features,
            order_index: editingPlan.order_index,
            plan_type: editingPlan.plan_type,
            duration_days: editingPlan.duration_days,
            countdown_enabled: editingPlan.countdown_enabled,
            countdown_ends_at: editingPlan.countdown_ends_at,
            limited_offer_banner: editingPlan.limited_offer_banner,
            is_visible: editingPlan.is_visible !== false
          })
          .eq('id', editingPlan.id);

        if (!error) {
          setPlans(plans.map(p => p.id === editingPlan.id ? {
            ...editingPlan,
            price: Number(editingPlan.price),
            countdown_enabled: editingPlan.countdown_enabled || false,
            countdown_ends_at: editingPlan.countdown_ends_at || null,
            limited_offer_banner: editingPlan.limited_offer_banner || null,
            is_visible: editingPlan.is_visible !== false
          } : p));
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
      order_index: plans.length,
      plan_type: 'monthly',
      duration_days: 30,
      countdown_enabled: false,
      countdown_ends_at: null,
      limited_offer_banner: null,
      is_visible: true
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

  const handleUserSearch = async (searchTerm: string) => {
    setUserSearch(searchTerm);
    
    if (searchTerm.length < 2) {
      setSearchResults([]);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, email, full_name')
      .or(`email.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`)
      .limit(10);

    if (!error && data) {
      setSearchResults(data);
    }
  };

  const handleSendBroadcast = async () => {
    if (!broadcastMessage.title || !broadcastMessage.message) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o título e a mensagem.",
        variant: "destructive",
      });
      return;
    }

    if (!broadcastMessage.sendToAll && !broadcastMessage.selectedUserId) {
      toast({
        title: "Selecione um usuário",
        description: "Escolha um usuário para enviar a mensagem.",
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
        return `<p>${line.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>')}</p>`;
      })
      .join('');

    // Inserir mensagem na tabela admin_messages
    const { error } = await supabase
      .from('admin_messages')
      .insert({
        title: broadcastMessage.title,
        message: broadcastMessage.message,
        content_html: `<div>${contentHtml}</div>`,
        image_url: broadcastMessage.imageUrl || null,
        sent_to_all: broadcastMessage.sendToAll,
        user_id: broadcastMessage.sendToAll ? null : broadcastMessage.selectedUserId,
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

    const description = broadcastMessage.sendToAll 
      ? `Broadcast enviado para ${stats.totalUsers} usuários.`
      : "Mensagem enviada para o usuário selecionado.";

    toast({
      title: "Mensagem enviada! 📨",
      description,
    });
    
    setBroadcastMessage({ 
      title: "", 
      message: "", 
      imageUrl: "", 
      sendToAll: true, 
      selectedUserId: "" 
    });
    setUserSearch("");
    setSearchResults([]);
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
    try {
      await signOut();
      toast({ title: "Logout realizado", description: "Você saiu da conta." });
    } catch (e) {
      console.log('Logout error (pode ser ignorado):', e);
    } finally {
      navigate("/auth", { replace: true });
    }
  };

  return (
    <>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-background to-primary/5">
        <AdminSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-gradient-to-r from-card via-card to-primary/5 border-b border-border/50 backdrop-blur-sm px-6 py-4 sticky top-0 z-50 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <SidebarTrigger />
                <Link to="/admin" className="bg-gradient-to-br from-warning/20 to-warning/10 p-3 rounded-xl shadow-glow animate-pulse cursor-pointer hover:from-warning/30 hover:to-warning/20 transition-smooth">
                  <Crown className="w-8 h-8 text-warning" />
                </Link>
                <div className="flex items-center gap-4">
                  <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                      Painel Master Admin
                    </h1>
                    <p className="text-sm text-muted-foreground">Controle total da plataforma</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 items-center">
                <NewUserNotifications />
                <TicketNotificationBell isAdmin={true} />
                <LanguageSelector />
                <ThemeToggle />
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

          {/* Main Content */}
          <main className="flex-1 overflow-auto px-6 py-8">
            {/* Overview Section */}
            {currentSection === 'overview' && (
              <>
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
                  <Card className="p-6 hover:shadow-xl hover-scale transition-smooth bg-gradient-to-br from-card to-primary/5 border-primary/20 group cursor-pointer" onClick={() => setIsBroadcastOpen(true)}>
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

                  <Card className="p-6 hover:shadow-xl hover-scale transition-smooth bg-gradient-to-br from-card to-info/5 border-info/20 group cursor-pointer" onClick={() => navigate('/admin?section=revenue')}>
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

                  <Card className="p-6 hover:shadow-xl hover-scale transition-smooth bg-gradient-to-br from-card to-warning/5 border-warning/20 group cursor-pointer" onClick={() => navigate('/admin?section=videos')}>
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

                  <Card className="p-6 hover:shadow-xl hover-scale transition-smooth bg-gradient-to-br from-card to-destructive/5 border-destructive/20 group cursor-pointer" onClick={() => navigate('/admin?section=admins')}>
                    <div className="flex items-center gap-4">
                      <div className="bg-gradient-to-br from-destructive/20 to-destructive/10 p-3 rounded-xl shadow-glow group-hover:scale-110 transition-transform">
                        <Shield className="w-6 h-6 text-destructive" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">Administradores</h3>
                        <p className="text-sm text-muted-foreground">Gerenciar acessos admin</p>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Online Users and Growth Chart */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-1">
                    <OnlineUsersPanel />
                  </div>
                  <div className="lg:col-span-2">
                    <GrowthChart />
                  </div>
                </div>
              </>
            )}

            {/* Users Section */}
            {currentSection === 'users' && <UsersPanel />}

            {/* Admins Section */}
            {currentSection === 'admins' && <AdminsPanel />}

            {/* Subscriptions Section */}
            {currentSection === 'subscriptions' && <SubscriptionsPanel />}

            {/* Revenue Section */}
            {currentSection === 'revenue' && (
              <ErrorBoundary>
                <RevenueChartPanel />
              </ErrorBoundary>
            )}

            {/* Landing Page Section */}
            {currentSection === 'landing' && <LandingPageEditor />}

            {/* Features Landing Section */}
            {currentSection === 'features-landing' && <LandingFeaturesEditor />}

            {/* FAQ Section */}
            {currentSection === 'faq' && <FAQEditor />}

            {/* Blog Section */}
            {currentSection === 'blog' && <BlogManager />}

            {/* Blog Settings Section */}
            {currentSection === 'blog-settings' && <BlogSettingsManager />}

            {/* Messages Section */}
            {currentSection === 'messages' && <AdminMessagesManager />}

            {/* Tickets Section */}
            {currentSection === 'tickets' && <TicketsManager />}

            {/* Vouchers Section */}
            {currentSection === 'vouchers' && <VouchersManager />}

            {/* Cupons de Desconto Section */}
            {currentSection === 'discount-coupons' && <DiscountCouponsManager />}

            {/* Criador de Páginas */}
            {currentSection === 'page-creator' && <PageCreator />}

            {/* Integrations Section */}
            {currentSection === 'integrations' && <MercadoPagoIntegration />}

            {/* Settings Section */}
            {currentSection === 'settings' && <SiteSettingsManager />}

            {/* Security Section */}
            {currentSection === 'security' && <AdminSecurityPanel />}

            {/* Plan Features Section */}
            {currentSection === 'plan-features' && <PlanFeaturesManager />}

            {/* Features Manager Section */}
            {currentSection === 'features-manager' && <FeaturesManager />}

            {/* Feature Overrides Section */}
{currentSection === 'feature-access' && (
  <ErrorBoundary>
    <FeatureOverridesManager />
  </ErrorBoundary>
)}

            {/* Videos Section */}
            {currentSection === 'videos' && (
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
            )}

            {/* Plans Section */}
            {currentSection === 'plans' && (
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
            )}

          </main>
      </div>
    </div>

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
              Enviar Mensagem
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-3">
              <Label>Destinatário</Label>
              <RadioGroup 
                value={broadcastMessage.sendToAll ? "all" : "specific"}
                onValueChange={(value) => {
                  setBroadcastMessage({ 
                    ...broadcastMessage, 
                    sendToAll: value === "all",
                    selectedUserId: value === "all" ? "" : broadcastMessage.selectedUserId
                  });
                  if (value === "all") {
                    setUserSearch("");
                    setSearchResults([]);
                  }
                }}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="all" />
                  <Label htmlFor="all" className="font-normal">
                    Todos os usuários ({stats.totalUsers})
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="specific" id="specific" />
                  <Label htmlFor="specific" className="font-normal">
                    Usuário específico
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {!broadcastMessage.sendToAll && (
              <div className="space-y-2">
                <Label htmlFor="user-search">Buscar Usuário</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="user-search"
                    placeholder="Digite nome ou email..."
                    value={userSearch}
                    onChange={(e) => handleUserSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                {searchResults.length > 0 && (
                  <ScrollArea className="h-40 border rounded-md">
                    <div className="p-2 space-y-1">
                      {searchResults.map((user) => (
                        <button
                          key={user.user_id}
                          onClick={() => {
                            setBroadcastMessage({ 
                              ...broadcastMessage, 
                              selectedUserId: user.user_id 
                            });
                            setUserSearch(`${user.full_name} (${user.email})`);
                            setSearchResults([]);
                          }}
                          className="w-full text-left p-2 hover:bg-accent rounded-md transition-colors"
                        >
                          <p className="font-medium text-sm">{user.full_name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                )}

                {broadcastMessage.selectedUserId && (
                  <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-md">
                    <User className="w-4 h-4 text-primary" />
                    <span className="text-sm flex-1">{userSearch}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setBroadcastMessage({ 
                          ...broadcastMessage, 
                          selectedUserId: "" 
                        });
                        setUserSearch("");
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}

            <div>
              <Label htmlFor="broadcast-title">Título</Label>
              <Input
                id="broadcast-title"
                value={broadcastMessage.title}
                onChange={(e) =>
                  setBroadcastMessage({ ...broadcastMessage, title: e.target.value })
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
              <Button variant="outline" onClick={() => {
                setIsBroadcastOpen(false);
                setUserSearch("");
                setSearchResults([]);
              }}>
                Cancelar
              </Button>
              <Button onClick={handleSendBroadcast} className="gradient-primary">
                <Send className="w-4 h-4 mr-2" />
                {broadcastMessage.sendToAll ? "Enviar para Todos" : "Enviar Mensagem"}
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
              <div className="grid grid-cols-2 gap-4">
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
                  <Label htmlFor="plan-type">Tipo do Plano</Label>
                  <select
                    id="plan-type"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={editingPlan.plan_type}
                    onChange={(e) =>
                      setEditingPlan({ ...editingPlan, plan_type: e.target.value as 'free' | 'monthly' | 'annual' | 'lifetime' })
                    }
                  >
                    <option value="free">Grátis</option>
                    <option value="monthly">Mensal</option>
                    <option value="annual">Anual</option>
                    <option value="lifetime">Vitalício</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                  <Label htmlFor="plan-duration">Duração (dias)</Label>
                  <Input
                    id="plan-duration"
                    type="number"
                    value={editingPlan.duration_days || ''}
                    onChange={(e) =>
                      setEditingPlan({ ...editingPlan, duration_days: e.target.value ? parseInt(e.target.value) : null })
                    }
                    placeholder="30"
                    disabled={editingPlan.plan_type === 'lifetime'}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {editingPlan.plan_type === 'lifetime' ? 'Vitalício não expira' : 'Número de dias de validade'}
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="plan-order">Ordem de Exibição</Label>
                <Input
                  id="plan-order"
                  type="number"
                  value={editingPlan.order_index ?? 0}
                  onChange={(e) =>
                    setEditingPlan({ ...editingPlan, order_index: parseInt(e.target.value) || 0 })
                  }
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Quanto menor o número, mais cedo aparece
                </p>
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
                <Label htmlFor="plan-features">Recursos (pressione Enter para adicionar novos)</Label>
                <Textarea
                  id="plan-features"
                  className="min-h-[150px]"
                  value={editingPlan.features.join("\n")}
                  onChange={(e) =>
                    setEditingPlan({
                      ...editingPlan,
                      features: e.target.value.split("\n").filter((f) => f.trim()),
                    })
                  }
                  placeholder="Recurso 1&#10;Recurso 2&#10;Recurso 3"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Digite um recurso por linha. Eles aparecerão organizados na landing page com ícones de check.
                </p>
              </div>

              <div className="border-t pt-4 space-y-4">
                <h3 className="font-semibold">Visibilidade do Plano</h3>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is-visible"
                    checked={editingPlan.is_visible !== false}
                    onChange={(e) =>
                      setEditingPlan({ ...editingPlan, is_visible: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <Label htmlFor="is-visible">Exibir na landing page e nos painéis dos usuários</Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Quando desmarcado, o plano ficará oculto tanto na página inicial quanto no painel de upgrade dos usuários
                </p>
              </div>

              <div className="border-t pt-4 space-y-4">
                <h3 className="font-semibold">Oferta por Tempo Limitado</h3>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="countdown-enabled"
                    checked={editingPlan.countdown_enabled || false}
                    onChange={(e) =>
                      setEditingPlan({ ...editingPlan, countdown_enabled: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <Label htmlFor="countdown-enabled">Ativar contagem regressiva</Label>
                </div>

                {editingPlan.countdown_enabled && (
                  <>
                    <div>
                      <Label htmlFor="countdown-ends">Data e hora de término</Label>
                      <Input
                        id="countdown-ends"
                        type="datetime-local"
                        value={editingPlan.countdown_ends_at?.slice(0, 16) || ''}
                        onChange={(e) =>
                          setEditingPlan({ ...editingPlan, countdown_ends_at: e.target.value ? new Date(e.target.value).toISOString() : null })
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="offer-banner">Texto do banner de oferta</Label>
                      <Input
                        id="offer-banner"
                        value={editingPlan.limited_offer_banner || ''}
                        onChange={(e) =>
                          setEditingPlan({ ...editingPlan, limited_offer_banner: e.target.value })
                        }
                        placeholder="🔥 OFERTA POR TEMPO LIMITADO!"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Este texto aparecerá no topo do card do plano
                      </p>
                    </div>
                  </>
                )}
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
      </SidebarProvider>
    </>
  );
};

export default AdminDashboard;
