import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap, MessageSquare, Settings, LogOut, Pencil, Trash2, Sparkles, CreditCard, Link2, Copy, ExternalLink, UserCircle, Scissors, FileText, QrCode, Calendar, ShoppingBag, ArrowLeft, Calculator, Brain, Globe, Users, HelpCircle, LinkIcon, Layers, MousePointer, DollarSign, CheckSquare, StickyNote, Eye, Megaphone, Code, UserCog, FileCheck, Filter, Download, ClipboardCheck, Briefcase } from "lucide-react";
import { useTheme } from "next-themes";
import logoLight from "@/assets/logo-light.png";
import logoDark from "@/assets/logo-dark.png";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserFeatures } from "@/hooks/useUserFeatures";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { NotificationBell } from "@/components/NotificationBell";
import { ConversationNotificationBell } from "@/components/ConversationNotificationBell";
import { TicketNotificationBell } from "@/components/TicketNotificationBell";
import ErrorBoundary from "@/components/ErrorBoundary";
import { UserSidebar } from "@/components/layout/UserSidebar";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useLanguage } from "@/contexts/LanguageContext";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { SubscriptionBanner } from "@/components/SubscriptionBanner";
import { MyPlanSection } from "@/components/MyPlanSection";
import { DraggableCalculator } from "@/components/DraggableCalculator";
import { MercadoPagoCheckout } from "@/components/MercadoPagoCheckout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TicketSystem } from "@/components/TicketSystem";
import { WhatsAppLinkGenerator } from "@/components/WhatsAppLinkGenerator";
import { VoucherRedemption } from "@/components/VoucherRedemption";
import { CRMContacts } from "@/components/CRMContacts";
import { PixelsManager } from "@/components/PixelsManager";
import { PageCloner } from "@/components/PageCloner";
import { LinkShortener } from "@/components/LinkShortener";
import { LinkBioCreator } from "@/components/LinkBioCreator";
import { MyAIAgents } from "@/components/MyAIAgents";
import { QRCodeGenerator } from "@/components/QRCodeGenerator";
import { GeneralCRMPanel } from "@/components/GeneralCRMPanel";
import { ClientsManagementPanel } from "@/components/ClientsManagementPanel";
import AgentManagementPanel from "@/components/AgentManagementPanel";
import { FloatingMultiButtonGenerator } from "@/components/FloatingMultiButtonGenerator";
import { FinancialManagementPanel } from "@/components/FinancialManagementPanel";
import { TeamManagementPanel } from "@/components/TeamManagementPanel";
import { AdsManagementPanel } from "@/components/AdsManagementPanel";
import { TaskOrganizerPanel } from "@/components/TaskOrganizerPanel";
import { PopupCreatorPanel } from "@/components/PopupCreatorPanel";
import { AdSpyPanel } from "@/components/AdSpyPanel";
import CreativeExtractorPanel from "@/components/CreativeExtractorPanel";
import { QuizCreatorPanel } from "@/components/QuizCreatorPanel";
import { BriefingResponsesPanel } from "@/components/BriefingResponsesPanel";
import { BriefingCreatorPanel } from "@/components/BriefingCreatorPanel";
import { MembersAreaCreator } from "@/components/MembersAreaCreator";
import { SimpleMembersArea } from "@/components/SimpleMembersArea";
import { TutorialVideos } from "@/components/TutorialVideos";
import { QuickNotesPanel } from "@/components/QuickNotesPanel";
import { TaskReminder } from "@/components/TaskReminder";
import { FeatureGate } from "@/components/FeatureGate";
import { MindMapCreatorPanel } from "@/components/MindMapCreatorPanel";
import { ProposalCreatorPanel } from "@/components/proposal/ProposalCreatorPanel";
import { AgendaPanel } from "@/components/AgendaPanel";
import { AgendaReminders } from "@/components/AgendaReminders";
import { AprovaJobPanel } from "@/components/AprovaJobPanel";
import { GlobalChatNotification } from "@/components/GlobalChatNotification";
import { PortfolioCreatorPanel } from "@/components/PortfolioCreatorPanel";
import { ManualDispatcherPanel } from "@/components/ManualDispatcherPanel";
import SalesFunnelPanel from "@/components/SalesFunnelPanel";
import { useUserPresence } from "@/hooks/useUserPresence";
import { TeamMemberBanner } from "@/components/TeamMemberBanner";
import { useTeamMember } from "@/contexts/TeamMemberContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { hasFeature, loading: featuresLoading } = useUserFeatures();
  const { resolvedTheme } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const [userFullName, setUserFullName] = useState<string>('');
  const [paymentProcessed, setPaymentProcessed] = useState(false);
  const { isTeamMember, teamMember, getAllowedIds, canAccessModule } = useTeamMember();
  
  // Track user presence for online status
  useUserPresence();
  
  const currentLogo = resolvedTheme === 'dark' ? logoDark : logoLight;
  const [stats, setStats] = useState({
    totalAgents: 0,
    activeConnections: 0,
    messagesThisMonth: 0,
    totalShortLinks: 0,
    totalLinkBios: 0,
    totalClonedPages: 0,
    totalQuizzes: 0,
    totalWebsites: 0,
    totalBriefings: 0,
    totalMembersAreas: 0,
    totalPopups: 0,
  });
  const [aiAgents, setAiAgents] = useState<any[]>([]);
  const [deletingAgentId, setDeletingAgentId] = useState<string | null>(null);
  const [selectedAgentForManagement, setSelectedAgentForManagement] = useState<any>(null);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const activeTab = searchParams.get('tab') || 'overview';
  const section = searchParams.get('section');
  const chatbotId = searchParams.get('chatbotId');
  const agentId = searchParams.get('agentId');

  // For team members, use admin's user ID for data fetching
  const effectiveUserId = isTeamMember && teamMember ? teamMember.adminUserId : user?.id;

  // Get team context for components (when team member)
  const getTeamContext = (moduleKey: string) => {
    if (!isTeamMember || !teamMember) return undefined;
    return {
      adminUserId: teamMember.adminUserId,
      allowedIds: getAllowedIds(moduleKey),
    };
  };

  // For team members: force navigation to the first allowed module (no parallel dashboard)
  useEffect(() => {
    if (!isTeamMember) return;

    const candidates = [
      { moduleKey: 'agenda', tab: 'agenda' },
      { moduleKey: 'crm', tab: 'clientes' },
      { moduleKey: 'financial', tab: 'financeiro' },
      { moduleKey: 'ads', tab: 'anuncios' },
      { moduleKey: 'tasks', tab: 'tarefas' },
      { moduleKey: 'ai_agents', tab: 'ai-agents' },
      { moduleKey: 'link_bio', tab: 'linkbio' },
      { moduleKey: 'briefings', tab: 'briefing' },
      { moduleKey: 'portfolio', tab: 'portfolio' },
      { moduleKey: 'cloner', tab: 'cloner' },
    ];

    const allowedTabs = candidates
      .filter((c) => canAccessModule(c.moduleKey))
      .map((c) => c.tab);

    const isAllowed = allowedTabs.includes(activeTab);
    const firstAllowed = allowedTabs[0];

    if (!firstAllowed) return;

    if (!isAllowed) {
      navigate(`/dashboard?tab=${firstAllowed}`, { replace: true });
    }
  }, [isTeamMember, canAccessModule, activeTab, navigate]);

  // Buscar nome do usuário da tabela profiles (skip for team members - they use teamMember.adminName)
  useEffect(() => {
    // Team members don't need to fetch profile - they already have adminName from context
    if (isTeamMember) return;
    
    const fetchUserProfile = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .single();
      
      if (!error && data?.full_name) {
        setUserFullName(data.full_name);
      }
    };

    fetchUserProfile();

    // Listener para atualizar em tempo real
    const channel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${user?.id}`
        },
        (payload) => {
          if (payload.new && payload.new.full_name) {
            setUserFullName(payload.new.full_name);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isTeamMember]);

  // Se tiver agentId na URL, abrir painel de gerenciamento
  useEffect(() => {
    if (agentId && activeTab === 'ai-agents') {
      const agent = aiAgents.find((a) => a.id === agentId);
      if (agent) {
        setSelectedAgentForManagement(agent);
      }
    }
  }, [agentId, aiAgents, activeTab]);

  // Processar status de pagamento do Mercado Pago
  useEffect(() => {
    if (paymentProcessed) return;
    
    const mpStatus = searchParams.get('status') || searchParams.get('collection_status');
    const paymentStatus = searchParams.get('payment');
    const paymentId = searchParams.get('payment_id') || searchParams.get('collection_id');
    
    // Se não há parâmetros de pagamento, não fazer nada
    if (!mpStatus && !paymentStatus && !paymentId) return;
    
    // Determinar o status real do pagamento
    let finalStatus: 'success' | 'failure' | 'pending' | null = null;
    
    if (paymentStatus) {
      finalStatus = paymentStatus as 'success' | 'failure' | 'pending';
    } else if (mpStatus) {
      if (mpStatus === 'approved') {
        finalStatus = 'success';
      } else if (mpStatus === 'pending' || mpStatus === 'in_process') {
        finalStatus = 'pending';
      } else if (mpStatus === 'rejected' || mpStatus === 'cancelled') {
        finalStatus = 'failure';
      }
    }
    
    if (finalStatus) {
      setPaymentProcessed(true);
      
      if (finalStatus === 'success') {
        toast({
          title: "🎉 Parabéns!",
          description: "Seu plano foi ativado com sucesso! Aproveite todos os recursos.",
          duration: 10000,
        });
      } else if (finalStatus === 'failure') {
        toast({
          title: "Pagamento não concluído",
          description: "Houve um problema com o pagamento. Tente novamente.",
          variant: "destructive",
        });
      } else if (finalStatus === 'pending') {
        toast({
          title: "⏳ Pagamento PIX em processamento",
          description: "Seu pagamento está sendo processado. Assim que for confirmado, seu plano será ativado automaticamente.",
          duration: 10000,
        });
      }
      
      // Limpar parâmetros de pagamento e garantir que esteja na tab meu-plano
      const newParams = new URLSearchParams();
      newParams.set('tab', 'meu-plano');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, paymentProcessed, toast, setSearchParams]);
  useEffect(() => {
    const fetchData = async () => {
      // For team members, use admin's user ID; for regular users, use their own
      if (!effectiveUserId) return;

      // Buscar agentes IA do usuário com contagem de cliques
      const { data: agentsData, error: agentsError } = await supabase
        .from('ai_agents')
        .select(`
          *,
          button_clicks:button_link_clicks(count)
        `)
        .eq('user_id', effectiveUserId)
        .order('created_at', { ascending: false });

      if (!agentsError && agentsData) {
        setAiAgents(agentsData);
      }
        
      if (agentsData) {
        // Buscar estatísticas de todos os recursos
        const [
          { count: shortLinksCount },
          { count: linkBiosCount },
          { count: clonedPagesCount },
          { count: quizzesCount },
          { count: websitesCount },
          { count: briefingsCount },
          { count: membersAreasCount },
          { count: popupsCount }
        ] = await Promise.all([
          supabase.from('short_links').select('*', { count: 'exact', head: true }).eq('user_id', effectiveUserId),
          supabase.from('link_bios').select('*', { count: 'exact', head: true }).eq('user_id', effectiveUserId),
          supabase.from('cloned_pages').select('*', { count: 'exact', head: true }).eq('user_id', effectiveUserId),
          supabase.from('quizzes').select('*', { count: 'exact', head: true }).eq('user_id', effectiveUserId),
          supabase.from('websites').select('*', { count: 'exact', head: true }).eq('user_id', effectiveUserId),
          supabase.from('briefings').select('*', { count: 'exact', head: true }).eq('user_id', effectiveUserId),
          supabase.from('members_areas').select('*', { count: 'exact', head: true }).eq('user_id', effectiveUserId),
          supabase.from('popups').select('*', { count: 'exact', head: true }).eq('user_id', effectiveUserId),
        ]);

        setStats({
          totalAgents: agentsData?.length || 0,
          activeConnections: agentsData?.filter(a => a.is_active).length || 0,
          messagesThisMonth: 0,
          totalShortLinks: shortLinksCount || 0,
          totalLinkBios: linkBiosCount || 0,
          totalClonedPages: clonedPagesCount || 0,
          totalQuizzes: quizzesCount || 0,
          totalWebsites: websitesCount || 0,
          totalBriefings: briefingsCount || 0,
          totalMembersAreas: membersAreasCount || 0,
          totalPopups: popupsCount || 0,
        });
      }
    };

    fetchData();

    // Subscrever mudanças em tempo real para agentes IA (only for regular users)
    if (!isTeamMember && effectiveUserId) {
      const agentsSubscription = supabase
        .channel('ai_agents_changes')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'ai_agents',
          filter: `user_id=eq.${effectiveUserId}`
        }, () => {
          fetchData();
        })
        .subscribe();

      return () => {
        agentsSubscription.unsubscribe();
      };
    }
  }, [effectiveUserId, isTeamMember]);

  const handleTabChange = (value: string) => {
    navigate(`/dashboard?tab=${value}`);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Logout realizado",
        description: "Até logo!",
      });
      navigate("/auth", { replace: true });
    } catch (error) {
      console.log('Logout error:', error);
      // Força navegação mesmo com erro
      navigate("/auth", { replace: true });
    }
  };

  const handleDeleteAgent = async () => {
    if (!deletingAgentId) return;

    const { error } = await supabase
      .from('ai_agents')
      .delete()
      .eq('id', deletingAgentId);

    if (error) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setAiAgents(aiAgents.filter(agent => agent.id !== deletingAgentId));
      toast({
        title: "Agente IA excluído",
        description: "O agente foi removido com sucesso.",
      });
    }
    setDeletingAgentId(null);
  };

  const handleEditAgent = (agentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/ai-agent?id=${agentId}`);
  };

  const handleCopyLink = (botId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const link = `${window.location.origin}/chat/${botId}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copiado! 🔗",
      description: "O link do chat foi copiado para a área de transferência.",
    });
  };

  const handleCopyAgentLink = (agentId: string, agentName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const slug = (agentName || '')
      .normalize('NFD').replace(/\p{Diacritic}/gu, '')
      .toLowerCase().trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    const link = `${window.location.origin}/chat/${agentId}/${slug || 'agent'}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copiado! 🔗",
      description: "O link do agente IA foi copiado para a área de transferência.",
    });
  };

  return (
    <>
      <GlobalChatNotification />
      <AgendaReminders />
      <DraggableCalculator isOpen={isCalculatorOpen} onClose={() => setIsCalculatorOpen(false)} />
      <SidebarProvider>
        <div className="min-h-screen flex flex-col w-full bg-background safe-area-inset">
        {/* Team Member Banner - Above everything including logo */}
        <TeamMemberBanner />
        
        <div className="flex flex-1">
        <UserSidebar />
        
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="bg-card border-b border-border px-2 xs:px-3 sm:px-4 md:px-6 lg:px-8 py-2 xs:py-3 sm:py-4 sticky top-0 z-40 safe-area-bottom">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              {/* Greeting - on top on mobile, center on desktop */}
              <div className="flex flex-col order-1 sm:order-2 min-w-0 flex-1 sm:items-center">
                <h1 className="text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl 3xl:text-3xl font-bold leading-tight truncate flex items-center gap-1">
                  {isTeamMember && teamMember 
                    ? `Painel de ${teamMember.adminName.split(' ')[0]}`
                    : `${t('hello')}, ${(userFullName || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário').split(' ')[0]}! 👋`
                  }
                  {/* Mobile: welcome message inline */}
                  {!isTeamMember && (
                    <span className="font-normal text-muted-foreground ml-1 text-[10px] xs:text-xs sm:hidden whitespace-nowrap">
                      - {t('welcome_back')}
                    </span>
                  )}
                </h1>
                {/* Desktop: welcome message below */}
                {!isTeamMember && (
                  <p className="hidden sm:block text-xs md:text-sm lg:text-base text-muted-foreground">
                    {t('welcome_back')}
                  </p>
                )}
                {isTeamMember && (
                  <p className="text-[9px] xs:text-[10px] sm:text-xs md:text-sm lg:text-base 3xl:text-lg text-muted-foreground">
                    Acesso como membro da equipe
                  </p>
                )}
              </div>

              {/* Menu row - below greeting on mobile, sides on desktop */}
              <div className="flex items-center justify-between gap-2 order-2 sm:order-1 sm:contents">
                {/* Left side - Sidebar trigger and logo */}
                <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-3 shrink-0 sm:order-1">
                  <SidebarTrigger className="shrink-0 h-8 w-8 xs:h-9 xs:w-9 sm:h-10 sm:w-10" />
                  <Link
                    to="/dashboard"
                    className="bg-primary/10 p-1 xs:p-1.5 sm:p-2 rounded-lg sm:rounded-xl cursor-pointer hover:bg-primary/20 transition-smooth shrink-0"
                  >
                    <img
                      src={currentLogo}
                      alt="Out App"
                      className="w-5 h-5 xs:w-6 xs:h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 3xl:w-12 3xl:h-12"
                    />
                  </Link>
                </div>

                {/* Right side - Actions */}
                <div className="flex items-center gap-0.5 xs:gap-1 sm:gap-2 lg:gap-3 shrink-0 sm:order-3">
                  {!isTeamMember && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsCalculatorOpen(true)}
                      title="Calculadora"
                      className="h-7 w-7 xs:h-8 xs:w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10 3xl:h-12 3xl:w-12"
                    >
                      <Calculator className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                    </Button>
                  )}
                  {!isTeamMember && <ConversationNotificationBell />}
                  {!isTeamMember && <NotificationBell />}
                  {!isTeamMember && <TicketNotificationBell />}
                  <div className="hidden md:flex items-center gap-1 lg:gap-2">
                    <LanguageSelector />
                    <ThemeToggle />
                  </div>
                  {!isTeamMember && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => navigate("/settings")}
                        size="icon"
                        className="h-7 w-7 xs:h-8 xs:w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10 3xl:h-12 3xl:w-12"
                      >
                        <Settings className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5" />
                      </Button>
                      <Button
                        onClick={handleLogout}
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 xs:h-8 xs:w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10 3xl:h-12 3xl:w-12"
                      >
                        <LogOut className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto px-2 xs:px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 3xl:px-12 py-3 xs:py-4 sm:py-6 md:py-8 lg:py-10 3xl:py-12">
        {/* Subscription Banner */}
        <SubscriptionBanner />

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">

          <TabsContent value="overview" className="space-y-3 xs:space-y-4 sm:space-y-6 md:space-y-8 lg:space-y-10">
        {/* Task Reminder */}
        <TaskReminder />
        
        {/* Quick Notes Panel */}
        <QuickNotesPanel />
        
        {/* Stats Summary */}
        <div className="grid gap-1.5 xs:gap-2 sm:gap-3 md:gap-4 lg:gap-5 grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 3xl:grid-cols-6">
          <Card className="p-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2 xs:p-3 sm:p-4 pb-0.5 xs:pb-1 sm:pb-2">
              <CardTitle className="text-[10px] xs:text-xs sm:text-sm md:text-base lg:text-lg font-medium">Chats</CardTitle>
              <MessageSquare className="h-2.5 w-2.5 xs:h-3 xs:w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-2 xs:p-3 sm:p-4 pt-0">
              <div className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold">{stats.totalAgents}</div>
            </CardContent>
          </Card>
          <Card className="p-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2 xs:p-3 sm:p-4 pb-0.5 xs:pb-1 sm:pb-2">
              <CardTitle className="text-[10px] xs:text-xs sm:text-sm md:text-base lg:text-lg font-medium truncate">Membros</CardTitle>
              <Users className="h-2.5 w-2.5 xs:h-3 xs:w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-muted-foreground shrink-0" />
            </CardHeader>
            <CardContent className="p-2 xs:p-3 sm:p-4 pt-0">
              <div className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold">{stats.totalMembersAreas}</div>
            </CardContent>
          </Card>
          <Card className="p-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2 xs:p-3 sm:p-4 pb-0.5 xs:pb-1 sm:pb-2">
              <CardTitle className="text-[10px] xs:text-xs sm:text-sm md:text-base lg:text-lg font-medium">Links</CardTitle>
              <Link2 className="h-2.5 w-2.5 xs:h-3 xs:w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-2 xs:p-3 sm:p-4 pt-0">
              <div className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold">{stats.totalShortLinks}</div>
            </CardContent>
          </Card>
          <Card className="p-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2 xs:p-3 sm:p-4 pb-0.5 xs:pb-1 sm:pb-2">
              <CardTitle className="text-[10px] xs:text-xs sm:text-sm md:text-base lg:text-lg font-medium">Briefings</CardTitle>
              <FileText className="h-2.5 w-2.5 xs:h-3 xs:w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-2 xs:p-3 sm:p-4 pt-0">
              <div className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold">{stats.totalBriefings}</div>
            </CardContent>
          </Card>
          <Card className="p-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2 xs:p-3 sm:p-4 pb-0.5 xs:pb-1 sm:pb-2">
              <CardTitle className="text-[10px] xs:text-xs sm:text-sm md:text-base lg:text-lg font-medium">Quiz</CardTitle>
              <HelpCircle className="h-2.5 w-2.5 xs:h-3 xs:w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-2 xs:p-3 sm:p-4 pt-0">
              <div className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold">{stats.totalQuizzes}</div>
            </CardContent>
          </Card>
          <Card className="p-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2 xs:p-3 sm:p-4 pb-0.5 xs:pb-1 sm:pb-2">
              <CardTitle className="text-[10px] xs:text-xs sm:text-sm md:text-base lg:text-lg font-medium">Páginas</CardTitle>
              <Copy className="h-2.5 w-2.5 xs:h-3 xs:w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-2 xs:p-3 sm:p-4 pt-0">
              <div className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold">{stats.totalClonedPages}</div>
            </CardContent>
          </Card>
        </div>

        {/* All Resources Grid - Card Style */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Chat Online */}
          {hasFeature('ai_agent') && (
            <Card className="p-4 sm:p-6 glass hover:shadow-glow transition-smooth cursor-pointer" onClick={() => navigate("/ai-agent")}>
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl font-bold mb-2">Criar Chat Online</h3>
                  <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
                    Assistente inteligente com IA que aprende com seu negócio
                  </p>
                </div>
                <div className="bg-primary/10 p-3 sm:p-4 rounded-2xl ml-2">
                  <MessageSquare className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                </div>
              </div>
              <Button className="w-full mt-2 sm:mt-4 gradient-primary shadow-glow">
                Criar Chat
              </Button>
            </Card>
          )}

          {/* Gerenciador de Links */}
          <Card className="p-4 sm:p-6 glass hover:shadow-glow transition-smooth cursor-pointer" onClick={() => handleTabChange('tools')}>
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl font-bold mb-2">Gerenciador de Links</h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
                  Crie links personalizados para seu WhatsApp
                </p>
              </div>
              <div className="bg-primary/10 p-3 sm:p-4 rounded-2xl ml-2">
                <ExternalLink className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
              </div>
            </div>
            <Button className="w-full mt-2 sm:mt-4 gradient-primary shadow-glow">
              Acessar
            </Button>
          </Card>

          {/* Link na Bio */}
          <Card className="p-4 sm:p-6 glass hover:shadow-glow transition-smooth cursor-pointer" onClick={() => handleTabChange('linkbio')}>
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl font-bold mb-2">Link na Bio</h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
                  Centralize todos os seus links em uma única página
                </p>
              </div>
              <div className="bg-primary/10 p-3 sm:p-4 rounded-2xl ml-2">
                <UserCircle className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
              </div>
            </div>
            <Button className="w-full mt-2 sm:mt-4 gradient-primary shadow-glow">
              Criar Link
            </Button>
          </Card>

          {/* Encurtador de Links */}
          {hasFeature('link_shortener') && (
            <Card className="p-4 sm:p-6 glass hover:shadow-glow transition-smooth cursor-pointer" onClick={() => handleTabChange('shortlinks')}>
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl font-bold mb-2">Encurtador de Links</h3>
                  <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
                    Encurte e rastreie seus links de forma profissional
                  </p>
                </div>
                <div className="bg-primary/10 p-3 sm:p-4 rounded-2xl ml-2">
                  <Scissors className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                </div>
              </div>
              <Button className="w-full mt-2 sm:mt-4 gradient-primary shadow-glow">
                Encurtar Link
              </Button>
            </Card>
          )}

          {/* Clonador de Páginas */}
          {hasFeature('page_cloner') && (
            <Card className="p-4 sm:p-6 glass hover:shadow-glow transition-smooth cursor-pointer" onClick={() => handleTabChange('cloner')}>
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl font-bold mb-2">Clonador de Páginas</h3>
                  <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
                    Clone páginas da web e personalize conforme sua necessidade
                  </p>
                </div>
                <div className="bg-primary/10 p-3 sm:p-4 rounded-2xl ml-2">
                  <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                </div>
              </div>
              <Button className="w-full mt-2 sm:mt-4 gradient-primary shadow-glow">
                Clonar Página
              </Button>
            </Card>
          )}

          {/* Área de Membros */}
          <Card className="p-4 sm:p-6 glass hover:shadow-glow transition-smooth cursor-pointer" onClick={() => handleTabChange('area-membros')}>
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl font-bold mb-2">Área de Membros</h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
                  Crie sua área de membros exclusiva
                </p>
              </div>
              <div className="bg-primary/10 p-3 sm:p-4 rounded-2xl ml-2">
                <Users className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
              </div>
            </div>
            <Button className="w-full mt-2 sm:mt-4 gradient-primary shadow-glow">
              Criar Área
            </Button>
          </Card>

          {/* Quiz */}
          <Card className="p-4 sm:p-6 glass hover:shadow-glow transition-smooth cursor-pointer" onClick={() => handleTabChange('criador-quizz')}>
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl font-bold mb-2">Criador de Quiz</h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
                  Crie quizzes interativos para engajar seu público
                </p>
              </div>
              <div className="bg-primary/10 p-3 sm:p-4 rounded-2xl ml-2">
                <HelpCircle className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
              </div>
            </div>
            <Button className="w-full mt-2 sm:mt-4 gradient-primary shadow-glow">
              Criar Quiz
            </Button>
          </Card>

          {/* Criador de Briefing */}
          <Card className="p-4 sm:p-6 glass hover:shadow-glow transition-smooth cursor-pointer" onClick={() => handleTabChange('briefing')}>
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl font-bold mb-2">Criador de Briefing</h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
                  Colete informações de forma organizada
                </p>
              </div>
              <div className="bg-primary/10 p-3 sm:p-4 rounded-2xl ml-2">
                <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
              </div>
            </div>
            <Button className="w-full mt-2 sm:mt-4 gradient-primary shadow-glow">
              Criar Briefing
            </Button>
          </Card>

          {/* Pop-up */}
          <Card className="p-4 sm:p-6 glass hover:shadow-glow transition-smooth cursor-pointer" onClick={() => handleTabChange('popups')}>
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl font-bold mb-2">Criador de Pop-up</h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
                  Crie pop-ups personalizados para capturar leads
                </p>
              </div>
              <div className="bg-primary/10 p-3 sm:p-4 rounded-2xl ml-2">
                <Layers className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
              </div>
            </div>
            <Button className="w-full mt-2 sm:mt-4 gradient-primary shadow-glow">
              Criar Pop-up
            </Button>
          </Card>

          {/* Gerador de QR Code */}
          <Card className="p-4 sm:p-6 glass hover:shadow-glow transition-smooth cursor-pointer" onClick={() => handleTabChange('qrcode')}>
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl font-bold mb-2">Gerador de QR Code</h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
                  Crie QR codes personalizados
                </p>
              </div>
              <div className="bg-primary/10 p-3 sm:p-4 rounded-2xl ml-2">
                <QrCode className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
              </div>
            </div>
            <Button className="w-full mt-2 sm:mt-4 gradient-primary shadow-glow">
              Gerar QR Code
            </Button>
          </Card>

          {/* Botão Flutuante Multi-Links */}
          <Card className="p-4 sm:p-6 glass hover:shadow-glow transition-smooth cursor-pointer" onClick={() => handleTabChange('floating-button')}>
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl font-bold mb-2">Botão Flutuante</h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
                  Crie botões flutuantes com múltiplos links
                </p>
              </div>
              <div className="bg-primary/10 p-3 sm:p-4 rounded-2xl ml-2">
                <MousePointer className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
              </div>
            </div>
            <Button className="w-full mt-2 sm:mt-4 gradient-primary shadow-glow">
              Criar Botão
            </Button>
          </Card>

          {/* CRM Geral */}
          <Card className="p-4 sm:p-6 glass hover:shadow-glow transition-smooth cursor-pointer" onClick={() => handleTabChange('crm-geral')}>
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl font-bold mb-2">CRM</h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
                  Gerencie seus leads e contatos
                </p>
              </div>
              <div className="bg-primary/10 p-3 sm:p-4 rounded-2xl ml-2">
                <Users className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
              </div>
            </div>
            <Button className="w-full mt-2 sm:mt-4 gradient-primary shadow-glow">
              Acessar CRM
            </Button>
          </Card>

          {/* Gerenciamento Financeiro */}
          <Card className="p-4 sm:p-6 glass hover:shadow-glow transition-smooth cursor-pointer" onClick={() => handleTabChange('financeiro')}>
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl font-bold mb-2">Financeiro</h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
                  Controle suas finanças
                </p>
              </div>
              <div className="bg-primary/10 p-3 sm:p-4 rounded-2xl ml-2">
                <DollarSign className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
              </div>
            </div>
            <Button className="w-full mt-2 sm:mt-4 gradient-primary shadow-glow">
              Acessar
            </Button>
          </Card>

          {/* Organizador de Tarefas */}
          <Card className="p-4 sm:p-6 glass hover:shadow-glow transition-smooth cursor-pointer" onClick={() => handleTabChange('tarefas')}>
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl font-bold mb-2">Organizador de Tarefas</h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
                  Organize e gerencie suas tarefas
                </p>
              </div>
              <div className="bg-primary/10 p-3 sm:p-4 rounded-2xl ml-2">
                <CheckSquare className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
              </div>
            </div>
            <Button className="w-full mt-2 sm:mt-4 gradient-primary shadow-glow">
              Acessar
            </Button>
          </Card>

          {/* Gerenciador de Anúncios */}
          <Card className="p-4 sm:p-6 glass hover:shadow-glow transition-smooth cursor-pointer" onClick={() => handleTabChange('anuncios')}>
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl font-bold mb-2">Gerenciador de Anúncios</h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
                  Gerencie suas campanhas de anúncios
                </p>
              </div>
              <div className="bg-primary/10 p-3 sm:p-4 rounded-2xl ml-2">
                <Megaphone className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
              </div>
            </div>
            <Button className="w-full mt-2 sm:mt-4 gradient-primary shadow-glow">
              Acessar
            </Button>
          </Card>

          {/* Gestão de Clientes */}
          <Card className="p-4 sm:p-6 glass hover:shadow-glow transition-smooth cursor-pointer" onClick={() => handleTabChange('clientes')}>
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl font-bold mb-2">Gestão de Clientes</h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
                  Gerencie seus clientes
                </p>
              </div>
              <div className="bg-primary/10 p-3 sm:p-4 rounded-2xl ml-2">
                <Users className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
              </div>
            </div>
            <Button className="w-full mt-2 sm:mt-4 gradient-primary shadow-glow">
              Acessar
            </Button>
          </Card>

          {/* Gestão de Equipe */}
          <Card className="p-4 sm:p-6 glass hover:shadow-glow transition-smooth cursor-pointer" onClick={() => handleTabChange('equipe')}>
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl font-bold mb-2">Gestão de Equipe</h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
                  Gerencie sua equipe
                </p>
              </div>
              <div className="bg-primary/10 p-3 sm:p-4 rounded-2xl ml-2">
                <UserCog className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
              </div>
            </div>
            <Button className="w-full mt-2 sm:mt-4 gradient-primary shadow-glow">
              Acessar
            </Button>
          </Card>

          {/* Criador de Mapa Mental */}
          <Card className="p-4 sm:p-6 glass hover:shadow-glow transition-smooth cursor-pointer" onClick={() => handleTabChange('mapa-mental')}>
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl font-bold mb-2">Mapa Mental</h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
                  Organize suas ideias visualmente
                </p>
              </div>
              <div className="bg-primary/10 p-3 sm:p-4 rounded-2xl ml-2">
                <Brain className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
              </div>
            </div>
            <Button className="w-full mt-2 sm:mt-4 gradient-primary shadow-glow">
              Criar Mapa
            </Button>
          </Card>

          {/* Criador de Propostas */}
          <Card className="p-4 sm:p-6 glass hover:shadow-glow transition-smooth cursor-pointer" onClick={() => handleTabChange('propostas')}>
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl font-bold mb-2">Criador de Propostas</h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
                  Crie propostas comerciais profissionais
                </p>
              </div>
              <div className="bg-primary/10 p-3 sm:p-4 rounded-2xl ml-2">
                <FileCheck className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
              </div>
            </div>
            <Button className="w-full mt-2 sm:mt-4 gradient-primary shadow-glow">
              Criar Proposta
            </Button>
          </Card>

          {/* Agenda */}
          <Card className="p-4 sm:p-6 glass hover:shadow-glow transition-smooth cursor-pointer" onClick={() => handleTabChange('agenda')}>
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl font-bold mb-2">Agenda</h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
                  Organize seus eventos e lembretes
                </p>
              </div>
              <div className="bg-primary/10 p-3 sm:p-4 rounded-2xl ml-2">
                <Calendar className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
              </div>
            </div>
            <Button className="w-full mt-2 sm:mt-4 gradient-primary shadow-glow">
              Acessar
            </Button>
          </Card>

          {/* Funil de Vendas */}
          <Card className="p-4 sm:p-6 glass hover:shadow-glow transition-smooth cursor-pointer" onClick={() => handleTabChange('funil-vendas')}>
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl font-bold mb-2">Funil de Vendas</h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
                  Gerencie seu funil de vendas
                </p>
              </div>
              <div className="bg-primary/10 p-3 sm:p-4 rounded-2xl ml-2">
                <Filter className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
              </div>
            </div>
            <Button className="w-full mt-2 sm:mt-4 gradient-primary shadow-glow">
              Acessar
            </Button>
          </Card>

          {/* Disparador Zap Manual */}
          <Card className="p-4 sm:p-6 glass hover:shadow-glow transition-smooth cursor-pointer" onClick={() => handleTabChange('disparador')}>
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl font-bold mb-2">Disparador Zap Manual</h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
                  Envie mensagens em massa
                </p>
              </div>
              <div className="bg-primary/10 p-3 sm:p-4 rounded-2xl ml-2">
                <Zap className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
              </div>
            </div>
            <Button className="w-full mt-2 sm:mt-4 gradient-primary shadow-glow">
              Acessar
            </Button>
          </Card>

          {/* Criador de Portfólio */}
          <Card className="p-4 sm:p-6 glass hover:shadow-glow transition-smooth cursor-pointer" onClick={() => handleTabChange('portfolio')}>
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl font-bold mb-2">Criador de Portfólio</h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
                  Mostre seus trabalhos profissionalmente
                </p>
              </div>
              <div className="bg-primary/10 p-3 sm:p-4 rounded-2xl ml-2">
                <Briefcase className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
              </div>
            </div>
            <Button className="w-full mt-2 sm:mt-4 gradient-primary shadow-glow">
              Criar Portfólio
            </Button>
          </Card>

          {/* Aprova Job */}
          <Card className="p-4 sm:p-6 glass hover:shadow-glow transition-smooth cursor-pointer" onClick={() => handleTabChange('aprova-job')}>
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl font-bold mb-2">Aprova Job</h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
                  Aprovação de trabalhos com clientes
                </p>
              </div>
              <div className="bg-primary/10 p-3 sm:p-4 rounded-2xl ml-2">
                <ClipboardCheck className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
              </div>
            </div>
            <Button className="w-full mt-2 sm:mt-4 gradient-primary shadow-glow">
              Acessar
            </Button>
          </Card>

          {/* Extrator de Criativos */}
          <Card className="p-4 sm:p-6 glass hover:shadow-glow transition-smooth cursor-pointer" onClick={() => handleTabChange('extrator-criativos')}>
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl font-bold mb-2">Extrator de Criativos</h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
                  Extraia criativos de anúncios
                </p>
              </div>
              <div className="bg-primary/10 p-3 sm:p-4 rounded-2xl ml-2">
                <Download className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
              </div>
            </div>
            <Button className="w-full mt-2 sm:mt-4 gradient-primary shadow-glow">
              Acessar
            </Button>
          </Card>
        </div>

        {/* Meus Chats Section */}
        <Card className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold">Meus Chats</h2>
            <Button onClick={() => navigate("/ai-agent")} size="sm" className="w-full sm:w-auto">
              <MessageSquare className="w-4 h-4 mr-2" />
              Criar Chat
            </Button>
          </div>

          {aiAgents.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-primary/10 p-6 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <MessageSquare className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Nenhum chat criado ainda</h3>
              <p className="text-muted-foreground mb-6">
                Crie seu primeiro chat para automatizar atendimentos
              </p>
              <Button onClick={() => navigate("/ai-agent")} className="gradient-primary">
                <MessageSquare className="w-4 h-4 mr-2" />
                Criar Meu Primeiro Chat
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {aiAgents.map((agent) => (
                <div
                  key={agent.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl bg-accent/50 hover:bg-accent transition-smooth gap-3 sm:gap-4"
                  onClick={() => navigate("/ai-agent")}
                >
                  <div className="flex items-center gap-3 sm:gap-4 flex-1">
                    <div className="bg-primary/10 p-2 sm:p-3 rounded-xl">
                      <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm sm:text-base">{agent.name}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {agent.description || agent.niche || "Sem descrição"}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          🔗 {agent.button_clicks?.[0]?.count || 0} cliques em links
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
                    <span
                      className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium flex-1 sm:flex-none text-center ${
                        agent.is_active
                          ? "bg-success/20 text-success"
                          : "bg-warning/20 text-warning"
                      }`}
                    >
                      {agent.is_active ? "Ativo" : "Inativo"}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => handleCopyAgentLink(agent.id, agent.name, e)}
                      title="Copiar Link"
                    >
                      <Link2 className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => handleEditAgent(agent.id, e)}
                    >
                      <Pencil className="w-4 h-4 sm:mr-2" />
                      <span className="hidden sm:inline">Editar</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingAgentId(agent.id);
                      }}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
          </TabsContent>

          <TabsContent value="crm-geral">
            <FeatureGate featureKey="crm_contacts">
              <GeneralCRMPanel />
            </FeatureGate>
          </TabsContent>

          <TabsContent value="clientes">
            <ClientsManagementPanel teamContext={getTeamContext('crm')} />
          </TabsContent>

          <TabsContent value="floating-button">
            <FeatureGate featureKey="whatsapp_link">
              <FloatingMultiButtonGenerator />
            </FeatureGate>
          </TabsContent>


          <TabsContent value="tools">
            <FeatureGate featureKey="whatsapp_link">
              <WhatsAppLinkGenerator />
            </FeatureGate>
          </TabsContent>

          <TabsContent value="qrcode">
            <FeatureGate featureKey="qrcode_generator">
              <QRCodeGenerator />
            </FeatureGate>
          </TabsContent>

          <TabsContent value="disparador">
            <ManualDispatcherPanel />
          </TabsContent>

          <TabsContent value="funil-vendas">
            <SalesFunnelPanel />
          </TabsContent>

          <TabsContent value="management">
            <FeatureGate featureKey="ai_agent">
              {selectedAgentForManagement ? (
                <div>
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedAgentForManagement(null)}
                    className="mb-4"
                  >
                    ← Voltar para lista de agentes
                  </Button>
                  <AgentManagementPanel 
                    agentId={selectedAgentForManagement.id}
                    agentName={selectedAgentForManagement.name}
                  />
                </div>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Gestão de Chats</CardTitle>
                    <CardDescription>
                      Selecione um chat para gerenciar agendamentos e pedidos
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {aiAgents.length === 0 ? (
                      <div className="text-center py-12">
                        <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground mb-4">
                          Você ainda não tem agentes IA criados
                        </p>
                        <Button onClick={() => handleTabChange('ai-agents')}>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Criar Agente IA
                        </Button>
                      </div>
                    ) : (
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {aiAgents.map((agent) => (
                          <Card key={agent.id} className="cursor-pointer hover:shadow-lg transition-shadow"
                            onClick={() => setSelectedAgentForManagement(agent)}
                          >
                            <CardHeader>
                              <CardTitle className="text-lg">{agent.name}</CardTitle>
                              <CardDescription>{agent.niche}</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="w-4 h-4" />
                                <span>Agendamentos</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                                <ShoppingBag className="w-4 h-4" />
                                <span>Pedidos</span>
                              </div>
                              <Button className="w-full mt-4" variant="outline">
                                Gerenciar
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </FeatureGate>
          </TabsContent>

          <TabsContent value="linkbio">
            <ErrorBoundary>
              <FeatureGate featureKey="link_bio">
                <LinkBioCreator teamContext={getTeamContext('link_bio')} />
              </FeatureGate>
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="cloner">
            <FeatureGate featureKey="page_cloner">
              <PageCloner teamContext={getTeamContext('cloner')} />
            </FeatureGate>
          </TabsContent>


          <TabsContent value="crm">
            <FeatureGate featureKey="crm_contacts">
              <CRMContacts />
            </FeatureGate>
          </TabsContent>

          <TabsContent value="shortlinks">
            <FeatureGate featureKey="link_shortener">
              <LinkShortener />
            </FeatureGate>
          </TabsContent>

          <TabsContent value="support">
            <FeatureGate featureKey="ticket_system">
              <TicketSystem />
            </FeatureGate>
          </TabsContent>

          <TabsContent value="ai-agents">
            <FeatureGate featureKey="ai_agent">
              {selectedAgentForManagement ? (
                <Card className="p-6">
                  <div className="mb-6">
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedAgentForManagement(null)}
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Voltar
                    </Button>
                  </div>
                  <AgentManagementPanel
                    agentId={selectedAgentForManagement.id} 
                    agentName={selectedAgentForManagement.name}
                  />
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Gestão de Chats</CardTitle>
                    <CardDescription>
                      Selecione um chat para gerenciar agendamentos, pedidos e clientes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <MyAIAgents
                      teamContext={getTeamContext('ai_agents')}
                      onManage={(agent) => setSelectedAgentForManagement(agent)}
                    />
                  </CardContent>
                </Card>
              )}
            </FeatureGate>
          </TabsContent>

          <TabsContent value="voucher">
            <VoucherRedemption />
          </TabsContent>

          <TabsContent value="plan">
            <MyPlanSection />
          </TabsContent>

          <TabsContent value="financeiro">
            <FeatureGate featureKey="financial_management">
              <FinancialManagementPanel teamContext={getTeamContext('financial')} />
            </FeatureGate>
          </TabsContent>

          <TabsContent value="equipe">
            <FeatureGate featureKey="team_management">
              <TeamManagementPanel />
            </FeatureGate>
          </TabsContent>

          <TabsContent value="anuncios">
            <FeatureGate featureKey="ads_management">
              <AdsManagementPanel teamContext={getTeamContext('ads')} />
            </FeatureGate>
          </TabsContent>

          <TabsContent value="extrator-criativos">
            <CreativeExtractorPanel />
          </TabsContent>

          <TabsContent value="tarefas">
            <FeatureGate featureKey="task_organizer">
              <TaskOrganizerPanel teamContext={getTeamContext('tasks')} />
            </FeatureGate>
          </TabsContent>

          <TabsContent value="popups">
            <FeatureGate featureKey="popup_creator">
              <PopupCreatorPanel />
            </FeatureGate>
          </TabsContent>

          <TabsContent value="criador-quizz">
            <FeatureGate featureKey="quiz_creator">
              <ErrorBoundary>
                <QuizCreatorPanel />
              </ErrorBoundary>
            </FeatureGate>
          </TabsContent>

          <TabsContent value="briefing">
            <FeatureGate featureKey="briefing_creator">
              <Card>
                <CardHeader>
                  <CardTitle>Briefing</CardTitle>
                  <CardDescription>
                    Gerencie seus briefings e visualize respostas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="criador" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                      <TabsTrigger value="criador">
                        <FileText className="w-4 h-4 mr-2" />
                        Criador de Briefing
                      </TabsTrigger>
                      <TabsTrigger value="respostas">
                        <FileCheck className="w-4 h-4 mr-2" />
                        Respostas do Briefing
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="criador">
                      <BriefingCreatorPanel teamContext={getTeamContext('briefings')} />
                    </TabsContent>
                    
                    <TabsContent value="respostas">
                      <BriefingResponsesPanel />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </FeatureGate>
          </TabsContent>

          <TabsContent value="area-membros">
            <FeatureGate featureKey="members_area">
              <ErrorBoundary>
                <SimpleMembersArea />
              </ErrorBoundary>
            </FeatureGate>
          </TabsContent>

          <TabsContent value="tutoriais">
            <Card>
              <CardHeader>
                <CardTitle>Tutoriais</CardTitle>
                <CardDescription>
                  Aprenda a usar todas as funcionalidades da plataforma
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TutorialVideos />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mapa-mental">
            <MindMapCreatorPanel />
          </TabsContent>

          <TabsContent value="propostas">
            <ProposalCreatorPanel />
          </TabsContent>

          <TabsContent value="agenda">
            <AgendaPanel teamContext={getTeamContext('agenda')} />
          </TabsContent>

          <TabsContent value="aprova-job">
            <FeatureGate featureKey="aprova_job">
              <AprovaJobPanel />
            </FeatureGate>
          </TabsContent>

          <TabsContent value="portfolio">
            <FeatureGate featureKey="portfolio_creator">
              <PortfolioCreatorPanel teamContext={getTeamContext('portfolio')} />
            </FeatureGate>
          </TabsContent>
        </Tabs>
      </main>

      {/* Delete Confirmation Dialog for Agent */}
      <AlertDialog open={!!deletingAgentId} onOpenChange={() => setDeletingAgentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Agente IA</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este agente IA? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAgent} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
        </div>
      </div>
      </div>
    </SidebarProvider>
    </>
  );
};

export default Dashboard;
