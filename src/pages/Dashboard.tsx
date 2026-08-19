import { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap, MessageSquare, Settings, LogOut, Pencil, Trash2, Sparkles, CreditCard, Link2, Copy, ExternalLink, UserCircle, Scissors, FileText, QrCode, Calendar, ShoppingBag, ArrowLeft, Calculator, Brain, Globe, Users, HelpCircle, LinkIcon, Layers, MousePointer, DollarSign, CheckSquare, StickyNote, Eye, Megaphone, Code, UserCog, FileCheck, Filter, Download, ClipboardCheck, Briefcase, Search, X, Database, CalendarCheck, Table, Receipt, ShoppingCart, Target } from "lucide-react";
import { Input } from "@/components/ui/input";

import { useTheme } from "next-themes";
import logoAsset from "@/assets/Logo_3D_Verde.png.asset.json";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserFeatures } from "@/hooks/useUserFeatures";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { NotificationBell } from "@/components/NotificationBell";
import { ConversationNotificationBell } from "@/components/ConversationNotificationBell";
import { TicketNotificationBell } from "@/components/TicketNotificationBell";
import { MembersQuestionsBell } from "@/components/MembersQuestionsBell";
import ErrorBoundary from "@/components/ErrorBoundary";
import { UserSidebar } from "@/components/layout/UserSidebar";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useLanguage } from "@/contexts/LanguageContext";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { SubscriptionBanner } from "@/components/SubscriptionBanner";
import { SubscriptionGate } from "@/components/SubscriptionGate";
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

import { ClientsManagementPanel } from "@/components/ClientsManagementPanel";
import AgentManagementPanel from "@/components/AgentManagementPanel";
import { ResourceCard } from "@/components/dashboard/ResourceCard";
import { FloatingMultiButtonGenerator } from "@/components/FloatingMultiButtonGenerator";
import { FinancialManagementPanel } from "@/components/FinancialManagementPanel";
import { SecureDeleteDialog } from "@/components/ui/secure-delete-dialog";
import { TeamManagementPanel } from "@/components/TeamManagementPanel";
import { AdsManagementPanel } from "@/components/AdsManagementPanel";
import { TaskManagerContainer } from "@/components/tasks/TaskManagerContainer";
import { ScriptOrganizerPanel } from "@/components/ScriptOrganizerPanel";
import { PopupCreatorPanel } from "@/components/PopupCreatorPanel";
import { SitesCreatorPanel } from "@/components/sites/SitesCreatorPanel";

import { AdSpyPanel } from "@/components/AdSpyPanel";
import CreativeExtractorPanel from "@/components/CreativeExtractorPanel";
import { MarketingQuestionnairePanel } from "@/components/MarketingQuestionnairePanel";
import { BriefingResponsesPanel } from "@/components/BriefingResponsesPanel";
import { BriefingCreatorPanel } from "@/components/BriefingCreatorPanel";
// MembersAreaCreator removed - only Simple Members Area is used
import { SimpleMembersArea } from "@/components/SimpleMembersArea";
import { TutorialVideos } from "@/components/TutorialVideos";
import { FeatureTutorialVideo } from "@/components/FeatureTutorialVideo";
import { QuickNotesPanel } from "@/components/QuickNotesPanel";
import { TaskReminder } from "@/components/TaskReminder";
import { FeatureGate } from "@/components/FeatureGate";
import { MindMapCreatorPanel } from "@/components/MindMapCreatorPanel";
import { ProposalCreatorPanel } from "@/components/proposal/ProposalCreatorPanel";
import { ContractCreatorPanel } from "@/components/contracts/ContractCreatorPanel";
import { AgendaPanel } from "@/components/AgendaPanel";
import { AgendaReminders } from "@/components/AgendaReminders";
import { RoutineReminders } from "@/components/RoutineReminders";
import { AprovaJobPanel } from "@/components/AprovaJobPanel";
import { GlobalChatNotification } from "@/components/GlobalChatNotification";

import { ManualDispatcherPanel } from "@/components/ManualDispatcherPanel";
import SalesFunnelPanel from "@/components/SalesFunnelPanel";
import { SuppliersManagementPanel } from "@/components/SuppliersManagementPanel";
import { BusinessManagementPanel } from "@/components/BusinessManagementPanel";
import ProductsServicesPanel from "@/components/ProductsServicesPanel";
import RoutineOrganizerPanel from "@/components/RoutineOrganizerPanel";
import { ReceiptGeneratorPanel } from "@/components/ReceiptGeneratorPanel";
import { InvoiceGeneratorPanel } from "@/components/InvoiceGeneratorPanel";
import { CheckoutCreatorPanel } from "@/components/CheckoutCreatorPanel";
import { useUserPresence } from "@/hooks/useUserPresence";
import { PushNotificationPrompt } from "@/components/PushNotificationPrompt";
import { TeamMemberBanner } from "@/components/TeamMemberBanner";
import { useTeamMember } from "@/contexts/TeamMemberContext";
import { RegistrationManagerPanel } from "@/components/registration/RegistrationManagerPanel";
import { OrganizationTablesPanel } from "@/components/registration/OrganizationTablesPanel";
import { RegistrationCategoriesSettings } from "@/components/registration/RegistrationCategoriesSettings";
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
  const [resourceSearch, setResourceSearch] = useState("");
  const resourcesGridRef = useRef<HTMLDivElement>(null);
  const [favoriteResources, setFavoriteResources] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem("dashboard_favorite_resources");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const toggleFavoriteResource = (title: string) => {
    setFavoriteResources((prev) => {
      const next = prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title];
      try {
        localStorage.setItem("dashboard_favorite_resources", JSON.stringify(next));
      } catch { /* ignore */ }
      return next;
    });
  };

  useEffect(() => {
    const grid = resourcesGridRef.current;
    if (!grid) return;
    const query = resourceSearch.trim().toLowerCase();

    Array.from(grid.children).forEach((child) => {
      const el = child as HTMLElement;
      const title = el.querySelector("h3")?.textContent?.trim() ?? "";
      const isFav = favoriteResources.includes(title);

      el.style.display = !query || title.toLowerCase().includes(query) ? "" : "none";
      el.style.order = isFav ? "-1" : "0";
      el.style.position = "relative";

      let btn = el.querySelector<HTMLButtonElement>("[data-fav-btn]");
      if (!btn) {
        btn = document.createElement("button");
        btn.setAttribute("data-fav-btn", "true");
        btn.type = "button";
        btn.className =
          "absolute top-2 right-2 z-10 h-8 w-8 flex items-center justify-center rounded-full bg-background/70 backdrop-blur border border-border hover:bg-accent transition-colors";
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          toggleFavoriteResource(el.querySelector("h3")?.textContent?.trim() ?? "");
        });
        el.appendChild(btn);
      }
      btn.title = isFav ? "Remover dos favoritos" : "Marcar como favorito";
      btn.setAttribute("aria-label", btn.title);
      btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="${isFav ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${isFav ? "text-primary" : "text-muted-foreground"}"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
    });
  }, [resourceSearch, favoriteResources, searchParams.get("tab")]);

  
  // Track user presence for online status
  useUserPresence();
  
  const currentLogo = logoAsset.url;
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
  const [agentToDelete, setAgentToDelete] = useState<{id: string, name: string} | null>(null);
  const [selectedAgentForManagement, setSelectedAgentForManagement] = useState<any>(null);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const rawTab = searchParams.get('tab');
  // Compatibilidade: slug antigo "ai-agents" agora é "chat-online"
  const activeTab = (rawTab === 'ai-agents' ? 'chat-online' : rawTab) || 'overview';
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
      { moduleKey: 'ai_agents', tab: 'chat-online' },
      { moduleKey: 'link_bio', tab: 'linkbio' },
      { moduleKey: 'briefings', tab: 'briefing' },
      
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
    if (agentId && activeTab === 'chat-online') {
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

      // Buscar chats online do usuário com contagem de cliques
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
          (supabase as any).from('marketing_questionnaires').select('*', { count: 'exact', head: true }).eq('user_id', effectiveUserId),
          supabase.from('websites').select('*', { count: 'exact', head: true }).eq('user_id', effectiveUserId),
          supabase.from('briefings').select('*', { count: 'exact', head: true }).eq('user_id', effectiveUserId),
          supabase.from('simple_members_areas').select('*', { count: 'exact', head: true }).eq('user_id', effectiveUserId),
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

    // Subscrever mudanças em tempo real para chats online (only for regular users)
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
    if (!agentToDelete) return;

    const { error } = await supabase
      .from('ai_agents')
      .delete()
      .eq('id', agentToDelete.id);

    if (error) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setAiAgents(aiAgents.filter(agent => agent.id !== agentToDelete.id));
      toast({
        title: "Chat excluído",
        description: "O chat online foi removido com sucesso.",
      });
    }
    setAgentToDelete(null);
  };

  const handleEditAgent = (agentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/chat-online?id=${agentId}`);
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
    const link = `${window.location.origin}/chat-online/${agentId}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copiado! 🔗",
      description: "O link do chat online foi copiado para a área de transferência.",
    });
  };

  return (
    <>
      <GlobalChatNotification />
      <AgendaReminders />
      <RoutineReminders />
      <PushNotificationPrompt />
      <DraggableCalculator isOpen={isCalculatorOpen} onClose={() => setIsCalculatorOpen(false)} />
      <SidebarProvider>
        <div className="min-h-screen flex flex-col w-full bg-background overflow-hidden">
          <TeamMemberBanner />
          
          {/* Header */}
          <header className="bg-card/80 backdrop-blur-md border-b border-border px-2 sm:px-6 lg:px-8 h-14 sm:h-[72px] flex items-center sticky top-0 z-40">
            <div className="flex items-center justify-between w-full gap-2 sm:gap-4">

                {/* Greeting */}
                <div className="flex flex-col flex-1 min-w-0">
                  <h1 className="text-base sm:text-lg md:text-xl font-bold leading-tight truncate flex items-center gap-2">
                    {isTeamMember && teamMember 
                      ? `Painel de ${teamMember.adminName.split(' ')[0]}`
                      : `${t('hello')}, ${(userFullName || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário').split(' ')[0]}! 👋`
                    }
                  </h1>
                  {isTeamMember ? (
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      Acesso como membro da equipe
                    </p>
                  ) : (
                    <p className="hidden sm:block text-xs text-muted-foreground">
                      {t('welcome_back')}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 sm:gap-2">
                  <div className="flex items-center gap-1 sm:gap-2 mr-1 sm:mr-2">
                    <SidebarTrigger className="h-8 w-8 sm:h-9 sm:w-9" />
                    <Link
                      to="/dashboard"
                      className="hidden xs:block bg-primary/10 p-1.5 sm:p-2 rounded-lg sm:rounded-xl cursor-pointer hover:bg-primary/20 transition-smooth"
                    >
                      <img
                        src={currentLogo}
                        alt="Out App"
                        className="w-5 h-5 sm:w-6 sm:h-6"
                      />
                    </Link>
                  </div>

                  {!isTeamMember && (
                    <div className="hidden sm:flex items-center gap-1 sm:gap-2 border-l border-border pl-2 sm:pl-4 ml-1 sm:ml-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => window.open("/anotacoes", "_blank")}
                        title="Anotações Rápidas"
                        className="h-8 w-8 sm:h-9 sm:w-9"
                      >
                        <StickyNote className="w-4 h-4 sm:w-5 sm:h-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsCalculatorOpen(true)}
                        title="Calculadora"
                        className="h-8 w-8 sm:h-9 sm:w-9"
                      >
                        <Calculator className="w-4 h-4 sm:w-5 sm:h-5" />
                      </Button>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-1 sm:gap-2">
                    {!isTeamMember && <ConversationNotificationBell />}
                    {!isTeamMember && <NotificationBell />}
                    {!isTeamMember && <TicketNotificationBell />}
                    {!isTeamMember && <MembersQuestionsBell />}
                    <div className="hidden md:flex items-center gap-1">
                      <LanguageSelector />
                      <ThemeToggle />
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => window.open("/?site=1", "_blank")}
                      size="icon"
                      className="hidden sm:inline-flex h-8 w-8 sm:h-9 sm:w-9 ml-1"
                      title="Visitar site"
                    >
                      <Globe className="w-4 h-4" />
                    </Button>
                    {!isTeamMember && (
                      <Button
                        variant="outline"
                        onClick={() => navigate("/settings")}
                        size="icon"
                        className="h-8 w-8 sm:h-9 sm:w-9"
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      onClick={handleLogout}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 sm:h-9 sm:w-9"
                    >
                      <LogOut className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </header>
          <div className="flex flex-1 overflow-hidden">
            <UserSidebar />
            <main className="flex-1 overflow-auto px-2 xs:px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 3xl:px-12 py-3 xs:py-4 sm:py-6 md:py-8 lg:py-10 3xl:py-12">
        {/* Subscription Banner */}
        <SubscriptionBanner />

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <SubscriptionGate currentTab={activeTab}>

          <TabsContent value="overview" className="space-y-6 sm:space-y-8">
        {/* Resources Section Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1 bg-primary rounded-full" />
            <h2 className="text-xl font-bold tracking-tight">Recursos da Plataforma</h2>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar recurso..."
              value={resourceSearch}
              onChange={(e) => setResourceSearch(e.target.value)}
              className="pl-9 pr-9 h-9"
            />
            {resourceSearch && (
              <button
                type="button"
                onClick={() => setResourceSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center text-muted-foreground hover:text-foreground"
                aria-label="Limpar busca"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* All Resources Grid */}
        <div ref={resourcesGridRef} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 sm:gap-8 pb-6 items-stretch">
          {/* 1. Gestão Livre */}
          <ResourceCard
            title="Gestão Livre"
            description="Crie e personalize sua própria gestão para organizar o que quiser: pessoas, negócios, produtos, serviços e muito mais."
            icon={<Database className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />}
            onClick={() => handleTabChange('cadastro')}
          />

          {/* 2. Organizador de Tarefas */}
          <ResourceCard
            title="Organizador de Tarefas"
            description="Organize e gerencie suas tarefas"
            icon={<CheckSquare className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />}
            onClick={() => handleTabChange('tarefas')}
          />

          {/* 3. Organizador de Agenda */}
          <ResourceCard
            title="Organizador de Agenda"
            description="Organize seus eventos e lembretes"
            icon={<Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />}
            onClick={() => handleTabChange('agenda')}
          />

          {/* 4. Organizador de Rotina */}
          <ResourceCard
            title="Organizador de Rotina"
            description="Crie rotinas e hábitos organizados"
            icon={<CalendarCheck className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />}
            onClick={() => handleTabChange('rotina')}
          />

          {/* 5. Tabela de Organização */}
          <ResourceCard
            title="Tabela de Organização"
            description="Visualize e organize dados em tabelas"
            icon={<Table className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />}
            onClick={() => handleTabChange('tabelas-organizacao')}
          />

          {/* 6. Gestão Financeira */}
          <ResourceCard
            title="Gestão Financeira"
            description="Controle suas finanças"
            icon={<DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />}
            onClick={() => handleTabChange('financeiro')}
          />

          {/* 7. Gerador de Recibos */}
          <ResourceCard
            title="Gerador de Recibos"
            description="Crie recibos personalizados"
            icon={<Receipt className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />}
            onClick={() => handleTabChange('recibos')}
          />

          {/* 8. Gerador de Link para WhatsApp */}
          <ResourceCard
            title="Gerador de Link para WhatsApp"
            description="Crie links personalizados para seu WhatsApp"
            icon={<ExternalLink className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />}
            onClick={() => handleTabChange('tools')}
          />

          {/* 9. Botão Flutuante Multi-Links */}
          <ResourceCard
            title="Botão Flutuante Multi-Links"
            description="Crie botões flutuantes com múltiplos links"
            icon={<MousePointer className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />}
            onClick={() => handleTabChange('floating-button')}
            buttonText="Criar Botão"
          />

          {/* 10. Encurtador de Links */}
          {hasFeature('link_shortener') && (
            <ResourceCard
              title="Encurtador de Links"
              description="Encurte e rastreie seus links de forma profissional"
              icon={<Scissors className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />}
              onClick={() => handleTabChange('shortlinks')}
              buttonText="Encurtar Link"
            />
          )}

          {/* 11. Gerador de QR Code */}
          <ResourceCard
            title="Gerador de QR Code"
            description="Crie QR codes personalizados"
            icon={<QrCode className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />}
            onClick={() => handleTabChange('qrcode')}
            buttonText="Gerar QR Code"
          />

          {/* 12. Scripts de Atendimento */}
          <ResourceCard
            title="Scripts de Atendimento"
            description="Crie scripts para padronizar seus atendimentos"
            icon={<MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />}
            onClick={() => handleTabChange('scripts')}
          />

          {/* 13. Criador de Área de Membros */}
          <ResourceCard
            title="Criador de Área de Membros"
            description="Crie sua área de membros exclusiva"
            icon={<Users className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />}
            onClick={() => handleTabChange('area-membros')}
            buttonText="Criar Área"
          />

          {/* 14. Criador de Checkout */}
          <ResourceCard
            title="Criador de Checkout"
            description="Crie checkouts para vender seus produtos e serviços"
            icon={<ShoppingCart className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />}
            onClick={() => handleTabChange('checkout-creator')}
            buttonText="Criar Checkout"
          />

          {/* 15. Criador de Dados de Anúncios */}
          <ResourceCard
            title="Criador de Dados de Anúncios"
            description="Gerencie suas campanhas de anúncios"
            icon={<Megaphone className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />}
            onClick={() => handleTabChange('anuncios')}
          />

          {/* 16. Criador de Chat Online */}
          {hasFeature('ai_agent') && (
            <ResourceCard
              title="Criador de Chat Online"
              description="Sistema de conversa para atendimento online no site"
              icon={<MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />}
              onClick={() => navigate("/chat-online")}
              buttonText="Criar Chat"
            />
          )}

          {/* 17. Criador de Sites */}
          <ResourceCard
            title="Criador de Sites"
            description="Crie sites completos, páginas de captura, portfólios e catálogos com blocos"
            icon={<Globe className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />}
            onClick={() => handleTabChange('sites')}
            buttonText="Criar Site"
          />

          {/* 20. Clonador de Páginas */}
          {hasFeature('page_cloner') && (
            <ResourceCard
              title="Clonador de Páginas"
              description="Clone páginas da web e personalize conforme sua necessidade"
              icon={<Copy className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />}
              onClick={() => handleTabChange('cloner')}
              buttonText="Clonar Página"
            />
          )}

          {/* 21. Criador de Link na Bio */}
          <ResourceCard
            title="Criador de Link na Bio"
            description="Centralize todos os seus links em uma única página"
            icon={<UserCircle className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />}
            onClick={() => handleTabChange('linkbio')}
            buttonText="Criar Link"
          />

          {/* 22. Criador de Funil de Vendas */}
          <ResourceCard
            title="Criador de Funil de Vendas"
            description="Gerencie seu funil de vendas"
            icon={<Filter className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />}
            onClick={() => handleTabChange('funil-vendas')}
          />

          {/* 23. Criador de Briefing */}
          <ResourceCard
            title="Criador de Briefing"
            description="Colete informações de forma organizada"
            icon={<FileText className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />}
            onClick={() => handleTabChange('briefing')}
            buttonText="Criar Briefing"
          />

          {/* 24. Criador de Questionário */}
          <ResourceCard
            title="Criador de Questionário"
            description="Crie questionários simples e direcione ofertas com base nas respostas"
            icon={<ClipboardCheck className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />}
            onClick={() => handleTabChange('questionario-marketing')}
            buttonText="Criar Questionário"
          />

          {/* 25. Criador de Popups */}
          <ResourceCard
            title="Criador de Popups"
            description="Crie pop-ups personalizados para capturar leads"
            icon={<Layers className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />}
            onClick={() => handleTabChange('popups')}
            buttonText="Criar Pop-up"
          />

          {/* 26. Criador de Mapas Mentais */}
          <ResourceCard
            title="Criador de Mapas Mentais"
            description="Organize suas ideias visualmente"
            icon={<Brain className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />}
            onClick={() => handleTabChange('mapa-mental')}
            buttonText="Criar Mapa"
          />

          {/* 27. Criador de Propostas */}
          <ResourceCard
            title="Criador de Propostas"
            description="Crie propostas comerciais profissionais"
            icon={<FileCheck className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />}
            onClick={() => handleTabChange('propostas')}
            buttonText="Criar Proposta"
          />

          {/* 28. Criador de Contratos */}
          <ResourceCard
            title="Criador de Contratos"
            description="Crie contratos com assinatura digital"
            icon={<FileCheck className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />}
            onClick={() => handleTabChange('contratos')}
            buttonText="Criar Contrato"
          />

          {/* 29. Criador de Aprova Job */}
          <ResourceCard
            title="Criador de Aprova Job"
            description="Aprovação de trabalhos com clientes"
            icon={<ClipboardCheck className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />}
            onClick={() => handleTabChange('aprova-job')}
          />

          {/* 30. Extrator de Criativos */}
          <ResourceCard
            title="Extrator de Criativos"
            description="Extraia criativos de anúncios"
            icon={<Target className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />}
            onClick={() => handleTabChange('extrator-criativos')}
          />
        </div>

        {/* Meus Chats Section */}
        <Card className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold">Meus Chats</h2>
            <Button onClick={() => navigate("/chat-online")} size="sm" className="w-full sm:w-auto">
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
              <Button onClick={() => navigate("/chat-online")} className="gradient-primary">
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
                  onClick={() => navigate("/chat-online")}
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
                        setAgentToDelete({ id: agent.id, name: agent.name });
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

          <TabsContent value="cadastro">
            <ErrorBoundary>
              <FeatureTutorialVideo featureKey="cadastro" />
              <RegistrationManagerPanel 
                categoryId={searchParams.get('categoryId')} 
              />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="cadastro-settings">
            <ErrorBoundary>
              <FeatureTutorialVideo featureKey="cadastro" />
              <FeatureTutorialVideo featureKey="cadastro-settings" />
              <RegistrationCategoriesSettings />
            </ErrorBoundary>
          </TabsContent>



          <TabsContent value="clientes">
            <FeatureGate featureKey="clients_management">
              <FeatureTutorialVideo featureKey="clientes" />
              <ClientsManagementPanel teamContext={getTeamContext('crm')} />
            </FeatureGate>
          </TabsContent>

          <TabsContent value="negocios">
            <FeatureGate featureKey="business_management">
              <FeatureTutorialVideo featureKey="negocios" />
              <BusinessManagementPanel />
            </FeatureGate>
          </TabsContent>


          <TabsContent value="floating-button">
            <FeatureGate featureKey="whatsapp_link">
              <FeatureTutorialVideo featureKey="floating-button" />
              <FloatingMultiButtonGenerator />
            </FeatureGate>
          </TabsContent>


          <TabsContent value="tools">
            <FeatureGate featureKey="whatsapp_link">
              <FeatureTutorialVideo featureKey="tools" />
              <WhatsAppLinkGenerator />
            </FeatureGate>
          </TabsContent>

          <TabsContent value="qrcode">
            <FeatureGate featureKey="qrcode_generator">
              <FeatureTutorialVideo featureKey="qrcode" />
              <QRCodeGenerator />
            </FeatureGate>
          </TabsContent>

          <TabsContent value="disparador">
            <FeatureGate featureKey="manual_dispatcher">
              <FeatureTutorialVideo featureKey="disparador" />
              <ManualDispatcherPanel />
            </FeatureGate>
          </TabsContent>

          <TabsContent value="funil-vendas">
            <FeatureGate featureKey="sales_funnel">
              <FeatureTutorialVideo featureKey="funil-vendas" />
              <SalesFunnelPanel />
            </FeatureGate>
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
                          Você ainda não tem chats online criados
                        </p>
                        <Button onClick={() => handleTabChange('chat-online')}>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Criar Chat Online
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
                <FeatureTutorialVideo featureKey="linkbio" />
                <LinkBioCreator teamContext={getTeamContext('link_bio')} />
              </FeatureGate>
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="cloner">
            <FeatureGate featureKey="page_cloner">
              <FeatureTutorialVideo featureKey="cloner" />
              <PageCloner teamContext={getTeamContext('cloner')} />
            </FeatureGate>
          </TabsContent>


          <TabsContent value="crm">
            <FeatureGate featureKey="crm_contacts">
              <FeatureTutorialVideo featureKey="crm" />
              <CRMContacts />
            </FeatureGate>
          </TabsContent>

          <TabsContent value="shortlinks">
            <FeatureGate featureKey="link_shortener">
              <FeatureTutorialVideo featureKey="shortlinks" />
              <LinkShortener />
            </FeatureGate>
          </TabsContent>

          <TabsContent value="support">
            <FeatureGate featureKey="ticket_system">
              <FeatureTutorialVideo featureKey="support" />
              <TicketSystem />
            </FeatureGate>
          </TabsContent>


          <TabsContent value="chat-online">
            <FeatureGate featureKey="ai_agent">
              <FeatureTutorialVideo featureKey="chat-online" />
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
              <FeatureTutorialVideo featureKey="financeiro" />
              <FinancialManagementPanel teamContext={getTeamContext('financial')} />
            </FeatureGate>
          </TabsContent>

          <TabsContent value="tabelas-organizacao" className="m-0 p-0 border-none outline-none">
            <FeatureGate featureKey="financial_management">
              <div className="py-0">
                <FeatureTutorialVideo featureKey="tabelas-organizacao" />
                <OrganizationTablesPanel />
              </div>
            </FeatureGate>
          </TabsContent>

          <TabsContent value="checkout-creator">
            <FeatureGate featureKey="checkout_creator">
              <FeatureTutorialVideo featureKey="checkout-creator" />
              <CheckoutCreatorPanel />
            </FeatureGate>
          </TabsContent>


          <TabsContent value="equipe">
            <FeatureGate featureKey="team_management">
              <FeatureTutorialVideo featureKey="equipe" />
              <TeamManagementPanel />
            </FeatureGate>
          </TabsContent>

          <TabsContent value="anuncios">
            <FeatureGate featureKey="ads_management">
              <FeatureTutorialVideo featureKey="anuncios" />
              <AdsManagementPanel teamContext={getTeamContext('ads')} />
            </FeatureGate>
          </TabsContent>

          <TabsContent value="extrator-criativos">
            <FeatureGate featureKey="creative_extractor">
              <FeatureTutorialVideo featureKey="extrator-criativos" />
              <CreativeExtractorPanel />
            </FeatureGate>
          </TabsContent>


          <TabsContent value="tarefas">
            <FeatureGate featureKey="task_organizer">
              <FeatureTutorialVideo featureKey="tarefas" />
              <TaskManagerContainer teamContext={getTeamContext('tasks')} />
            </FeatureGate>
          </TabsContent>

          <TabsContent value="produtos-servicos">
            <ErrorBoundary>
              <FeatureTutorialVideo featureKey="produtos-servicos" />
              <ProductsServicesPanel />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="sites">
            <ErrorBoundary>
              <FeatureTutorialVideo featureKey="sites" />
              <SitesCreatorPanel />
            </ErrorBoundary>
          </TabsContent>



          <TabsContent value="popups">
            <FeatureGate featureKey="popup_creator">
              <FeatureTutorialVideo featureKey="popups" />
              <PopupCreatorPanel />
            </FeatureGate>
          </TabsContent>


          <TabsContent value="questionario-marketing">
            <FeatureGate featureKey="quiz_creator">
              <ErrorBoundary>
                <FeatureTutorialVideo featureKey="questionario-marketing" />
                <MarketingQuestionnairePanel />
              </ErrorBoundary>
            </FeatureGate>
          </TabsContent>

          <TabsContent value="briefing">
            <FeatureGate featureKey="briefing_creator">
              <FeatureTutorialVideo featureKey="briefing" />
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
                <FeatureTutorialVideo featureKey="area-membros" />
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
            <FeatureGate featureKey="mind_map">
              <FeatureTutorialVideo featureKey="mapa-mental" />
              <MindMapCreatorPanel />
            </FeatureGate>
          </TabsContent>

          <TabsContent value="propostas">
            <FeatureGate featureKey="proposal_creator">
              <FeatureTutorialVideo featureKey="propostas" />
              <ProposalCreatorPanel />
            </FeatureGate>
          </TabsContent>

          <TabsContent value="contratos">
            <FeatureTutorialVideo featureKey="contratos" />
            <ContractCreatorPanel />
          </TabsContent>


          <TabsContent value="agenda">
            <FeatureGate featureKey="agenda">
              <FeatureTutorialVideo featureKey="agenda" />
              <AgendaPanel teamContext={getTeamContext('agenda')} />
            </FeatureGate>
          </TabsContent>

          <TabsContent value="aprova-job">
            <FeatureGate featureKey="aprova_job">
              <FeatureTutorialVideo featureKey="aprova-job" />
              <AprovaJobPanel />
            </FeatureGate>
          </TabsContent>



          <TabsContent value="rotina">
            <FeatureGate featureKey="routine_organizer">
              <FeatureTutorialVideo featureKey="rotina" />
              <RoutineOrganizerPanel />
            </FeatureGate>
          </TabsContent>

          <TabsContent value="recibos">
            <FeatureGate featureKey="receipt_generator">
              <FeatureTutorialVideo featureKey="recibos" />
              <ReceiptGeneratorPanel />
            </FeatureGate>
          </TabsContent>

          <TabsContent value="faturas">
            <FeatureGate featureKey="invoice_generator">
              <FeatureTutorialVideo featureKey="faturas" />
              <InvoiceGeneratorPanel />
            </FeatureGate>
          </TabsContent>

          <TabsContent value="scripts">
            <FeatureGate featureKey="script_organizer">
              <FeatureTutorialVideo featureKey="scripts" />
              <ScriptOrganizerPanel />
            </FeatureGate>
          </TabsContent>

          </SubscriptionGate>
        </Tabs>
      </main>
      {/* Delete Confirmation Dialog for Agent */}
      <SecureDeleteDialog
        open={!!agentToDelete}
        onOpenChange={(open) => !open && setAgentToDelete(null)}
        onConfirm={handleDeleteAgent}
        title="Excluir Chat Online"
        description="Esta ação excluirá permanentemente este chat online e todas as suas configurações. Para confirmar, digite 'excluir' abaixo."
        itemName={agentToDelete?.name}
      />
        </div>
      </div>
    </SidebarProvider>
    </>
  );
};

export default Dashboard;
