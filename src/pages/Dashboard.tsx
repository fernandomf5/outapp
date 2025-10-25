import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, Zap, MessageSquare, Settings, LogOut, Pencil, Trash2, Sparkles, CreditCard, Link2, Copy, ExternalLink, UserCircle, Scissors, FileText, QrCode, Calendar, ShoppingBag } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserFeatures } from "@/hooks/useUserFeatures";
import { NotificationBell } from "@/components/NotificationBell";
import { TicketNotificationBell } from "@/components/TicketNotificationBell";
import { UserSidebar } from "@/components/layout/UserSidebar";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useLanguage } from "@/contexts/LanguageContext";
import { CustomCursor } from "@/components/CustomCursor";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TutorialVideos } from "@/components/TutorialVideos";
import { SubscriptionBanner } from "@/components/SubscriptionBanner";
import { MyPlanSection } from "@/components/MyPlanSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TicketSystem } from "@/components/TicketSystem";
import { WhatsAppLinkGenerator } from "@/components/WhatsAppLinkGenerator";
import { VoucherRedemption } from "@/components/VoucherRedemption";
import { CRMContacts } from "@/components/CRMContacts";
import { PixelsManager } from "@/components/PixelsManager";
import { PageCloner } from "@/components/PageCloner";
import { ChatbotConversations } from "@/components/ChatbotConversations";
import { LinkShortener } from "@/components/LinkShortener";
import { CapturedLeads } from "@/components/CapturedLeads";
import { LinkBioCreator } from "@/components/LinkBioCreator";
import { MyChatbots } from "@/components/MyChatbots";
import { MyAIAgents } from "@/components/MyAIAgents";
import { QRCodeGenerator } from "@/components/QRCodeGenerator";
import AgentManagementPanel from "@/components/AgentManagementPanel";
import { ChatbotManagementPanel } from "@/components/ChatbotManagementPanel";
import { ChatbotAnalyticsPanel } from "@/components/ChatbotAnalyticsPanel";
import { ChatbotCustomersPanel } from "@/components/ChatbotCustomersPanel";
import { ChatbotConversationsPanel } from "@/components/ChatbotConversationsPanel";
import { ChatbotProductsPanel } from "@/components/ChatbotProductsPanel";
import { ChatbotAppointmentsPanel } from "@/components/ChatbotAppointmentsPanel";
import { ChatbotOrdersPanel } from "@/components/ChatbotOrdersPanel";
import { ChatbotFinancialPanel } from "@/components/ChatbotFinancialPanel";
import { ChatbotSchedulePanel } from "@/components/ChatbotSchedulePanel";
import { ChatbotAutomationsPanel } from "@/components/ChatbotAutomationsPanel";
import { ChatbotReviewsPanel } from "@/components/ChatbotReviewsPanel";
import { ChatbotNotificationsPanel } from "@/components/ChatbotNotificationsPanel";
import { ChatbotReportsPanel } from "@/components/ChatbotReportsPanel";
import AgentAnalyticsPanel from "@/components/AgentAnalyticsPanel";
import AgentCustomersPanel from "@/components/AgentCustomersPanel";
import AgentConversationsPanel from "@/components/AgentConversationsPanel";
import AgentProductsPanel from "@/components/AgentProductsPanel";
import AgentAppointmentsPanel from "@/components/AgentAppointmentsPanel";
import AgentOrdersPanel from "@/components/AgentOrdersPanel";
import AgentFinancialPanel from "@/components/AgentFinancialPanel";
import AgentSchedulePanel from "@/components/AgentSchedulePanel";
import AgentAutomationsPanel from "@/components/AgentAutomationsPanel";
import AgentReviewsPanel from "@/components/AgentReviewsPanel";
import AgentNotificationsPanel from "@/components/AgentNotificationsPanel";
import AgentReportsPanel from "@/components/AgentReportsPanel";
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
  const [searchParams] = useSearchParams();
  const [stats, setStats] = useState({
    totalBots: 0,
    activeConnections: 0,
    messagesThisMonth: 0,
  });
  const [chatbots, setChatbots] = useState<any[]>([]);
  const [aiAgents, setAiAgents] = useState<any[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingAgentId, setDeletingAgentId] = useState<string | null>(null);
  const [selectedAgentForManagement, setSelectedAgentForManagement] = useState<any>(null);
  const [selectedChatbotForManagement, setSelectedChatbotForManagement] = useState<any>(null);
  const activeTab = searchParams.get('tab') || 'overview';
  const [unreadClientMessages, setUnreadClientMessages] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      // Buscar chatbots do usuário com contagem de cliques
      const { data: botsData, error: botsError } = await supabase
        .from('chatbots')
        .select(`
          *,
          button_clicks:button_link_clicks(count)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Buscar agentes IA do usuário com contagem de cliques
      const { data: agentsData, error: agentsError } = await supabase
        .from('ai_agents')
        .select(`
          *,
          button_clicks:button_link_clicks(count)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!botsError && botsData) {
        setChatbots(botsData);
      }

      if (!agentsError && agentsData) {
        setAiAgents(agentsData);
      }
        
      if (botsData || agentsData) {
        // Buscar conexões ativas
        const { data: connectionsData } = await supabase
          .from('whatsapp_connections')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_connected', true);

        setStats({
          totalBots: botsData?.length || 0,
          activeConnections: agentsData?.filter(a => a.is_active).length || 0,
          messagesThisMonth: 0, // Este valor viria de uma tabela de mensagens quando implementada
        });
      }
    };

    fetchData();

    // Subscrever mudanças em tempo real para chatbots
    const chatbotsSubscription = supabase
      .channel('chatbots_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'chatbots',
        filter: `user_id=eq.${user?.id}`
      }, () => {
        fetchData();
      })
      .subscribe();

    // Subscrever mudanças em tempo real para agentes IA
    const agentsSubscription = supabase
      .channel('ai_agents_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'ai_agents',
        filter: `user_id=eq.${user?.id}`
      }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      chatbotsSubscription.unsubscribe();
      agentsSubscription.unsubscribe();
    };
  }, [user]);

  // Monitorar mensagens de clientes em tempo real
  useEffect(() => {
    if (!user) return;

    const fetchChatbotIds = async () => {
      const { data: chatbots } = await supabase
        .from('chatbots')
        .select('id')
        .eq('user_id', user.id);

      if (!chatbots || chatbots.length === 0) return [];
      return chatbots.map(c => c.id);
    };

    fetchChatbotIds().then(chatbotIds => {
      if (chatbotIds.length === 0) return;

      // Subscrever a mensagens de clientes (role='user')
      const clientMessagesChannel = supabase
        .channel('client-messages-notification')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'chatbot_messages',
        }, async (payload) => {
          const newMessage = payload.new as any;
          
          console.log('📨 Nova mensagem inserida:', {
            role: newMessage.role,
            node_id: newMessage.node_id,
            node_id_type: typeof newMessage.node_id,
            content: newMessage.content.substring(0, 50)
          });
          
          // Verificar se é mensagem de cliente (role='user') E mensagem livre (sem node_id)
          // Quando o cliente clica em botão do fluxo, node_id vem preenchido
          // Quando o cliente digita livremente, node_id é null, undefined ou string vazia
          const isUserMessage = newMessage.role === 'user';
          const isFreeMessage = !newMessage.node_id || newMessage.node_id === null || newMessage.node_id === '';
          
          if (!isUserMessage) {
            console.log('⏭️ Mensagem ignorada - não é do usuário');
            return;
          }
          
          if (!isFreeMessage) {
            console.log('⏭️ Mensagem ignorada - tem node_id (botão do fluxo)');
            return;
          }

          console.log('🔔 Mensagem livre detectada! Incrementando contador');

          // Verificar se a conversa pertence a um dos chatbots do usuário
          const { data: conversation } = await supabase
            .from('chatbot_conversations')
            .select('chatbot_id')
            .eq('id', newMessage.conversation_id)
            .single();

          if (conversation && chatbotIds.includes(conversation.chatbot_id)) {
            // Incrementar contador apenas se não estiver na aba clientes
            if (activeTab !== 'clients') {
              console.log('✅ Incrementando contador de mensagens não lidas');
              setUnreadClientMessages(prev => prev + 1);
            } else {
              console.log('ℹ️ Usuário já está na aba clientes - não incrementar');
            }
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(clientMessagesChannel);
      };
    });
  }, [user, activeTab]);

  // Resetar contador quando entrar na aba clientes
  useEffect(() => {
    if (activeTab === 'clients') {
      setUnreadClientMessages(0);
    }
  }, [activeTab]);

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
    } catch (error) {
      // Ignora erros de sessão já expirada
      console.log('Logout error (pode ser ignorado):', error);
    } finally {
      // Sempre redireciona para auth, mesmo com erro
      navigate("/auth");
    }
  };

  const handleEdit = (botId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/bot-builder?id=${botId}`);
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    const { error } = await supabase
      .from('chatbots')
      .delete()
      .eq('id', deletingId);

    if (error) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setChatbots(chatbots.filter(bot => bot.id !== deletingId));
      toast({
        title: "Chatbot excluído",
        description: "O chatbot foi removido com sucesso.",
      });
    }
    setDeletingId(null);
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
      description: "O link do chatbot foi copiado para a área de transferência.",
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
      <CustomCursor />
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
        <UserSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-card border-b border-border px-4 sm:px-6 py-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <SidebarTrigger />
                <div className="bg-primary/10 p-2 rounded-xl">
                  <Bot className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold">
                    {t('hello')}, {user?.email?.split('@')[0] || 'Usuário'}! 👋
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground">{t('welcome_back')}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
                <NotificationBell />
                <TicketNotificationBell />
                <LanguageSelector />
                <ThemeToggle />
                <Button variant="outline" onClick={() => navigate("/settings")} className="flex-1 sm:flex-none" size="sm">
                  <Settings className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">{t('settings')}</span>
                </Button>
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  className="flex-1 sm:flex-none"
                  size="sm"
                >
                  <LogOut className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">{t('logout')}</span>
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Subscription Banner */}
        <SubscriptionBanner />

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="flex flex-wrap w-full mb-8 h-auto">
            <TabsTrigger value="overview">{t('overview')}</TabsTrigger>
            <TabsTrigger value="chatbots">{t('chatbots')}</TabsTrigger>
            <TabsTrigger value="ai-agents">{t('ai_agents')}</TabsTrigger>
            <TabsTrigger value="leads">{t('captured_leads_title')}</TabsTrigger>
            <TabsTrigger value="clients" className="relative">
              {t('clients')}
              {unreadClientMessages > 0 && (
                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadClientMessages > 9 ? '9+' : unreadClientMessages}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="tools">{t('tools')}</TabsTrigger>
            <TabsTrigger value="qrcode">
              <QrCode className="w-4 h-4 mr-2" />
              QR Code
            </TabsTrigger>
            <TabsTrigger value="linkbio">Link na Bio</TabsTrigger>
            {hasFeature('link_shortener') && (
              <TabsTrigger value="shortlinks">
                <Link2 className="w-4 h-4 mr-2" />
                {t('shortlinks')}
              </TabsTrigger>
            )}
            {hasFeature('page_cloner') && (
              <TabsTrigger value="cloner">{t('cloner')}</TabsTrigger>
            )}
            {hasFeature('ticket_system') && (
              <TabsTrigger value="support">{t('support')}</TabsTrigger>
            )}
            <TabsTrigger value="voucher">Voucher</TabsTrigger>
            <TabsTrigger value="plan">
              <CreditCard className="w-4 h-4 mr-2" />
              {t('my_plan')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 sm:space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="p-4 sm:p-6 hover:shadow-lg transition-smooth">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="bg-primary/10 p-2 sm:p-3 rounded-xl">
                <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold mb-1">{stats.totalBots}</h3>
            <p className="text-sm sm:text-base text-muted-foreground">Bots Criados</p>
          </Card>

          <Card className="p-4 sm:p-6 hover:shadow-lg transition-smooth">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="bg-success/10 p-2 sm:p-3 rounded-xl">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-success" />
              </div>
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold mb-1">{stats.activeConnections}</h3>
            <p className="text-sm sm:text-base text-muted-foreground">Agentes IA Ativos</p>
          </Card>

          <Card className="p-4 sm:p-6 hover:shadow-lg transition-smooth">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="bg-info/10 p-2 sm:p-3 rounded-xl">
                <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-info" />
              </div>
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold mb-1">{stats.messagesThisMonth}</h3>
            <p className="text-sm sm:text-base text-muted-foreground">Conversas Este Mês</p>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {hasFeature('chatbot_web') && (
            <Card className="p-4 sm:p-6 glass hover:shadow-glow transition-smooth cursor-pointer" onClick={() => navigate("/bot-builder")}>
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl font-bold mb-2">Criar Chatbot Web</h3>
                  <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
                    Bot conversacional para seu site com fluxos personalizados
                  </p>
                </div>
                <div className="bg-primary/10 p-3 sm:p-4 rounded-2xl ml-2">
                  <Bot className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                </div>
              </div>
              <Button className="w-full mt-2 sm:mt-4 gradient-primary shadow-glow">
                Criar Chatbot
              </Button>
            </Card>
          )}

          {hasFeature('ai_agent') && (
            <Card className="p-4 sm:p-6 glass hover:shadow-glow transition-smooth cursor-pointer" onClick={() => navigate("/ai-agent")}>
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl font-bold mb-2">Criar Agente IA</h3>
                  <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
                    Assistente inteligente com IA que aprende com seu negócio
                  </p>
                </div>
                <div className="bg-primary/10 p-3 sm:p-4 rounded-2xl ml-2">
                  <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                </div>
              </div>
              <Button className="w-full mt-2 sm:mt-4 gradient-primary shadow-glow">
                Criar Agente
              </Button>
            </Card>
          )}

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
        </div>

        {/* Tutorial Videos */}
        <div className="mb-6 sm:mb-8">
          <TutorialVideos />
        </div>

        {/* Recent Activity */}
        <Card className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold">Meus Chatbots</h2>
            <Button onClick={() => navigate("/bot-builder")} size="sm" className="w-full sm:w-auto">
              <Bot className="w-4 h-4 mr-2" />
              Criar Chatbot
            </Button>
          </div>

          {chatbots.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-primary/10 p-6 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Bot className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Nenhum chatbot criado ainda</h3>
              <p className="text-muted-foreground mb-6">
                Comece criando seu primeiro chatbot para automatizar seu WhatsApp
              </p>
              <Button onClick={() => navigate("/bot-builder")} className="gradient-primary">
                <Bot className="w-4 h-4 mr-2" />
                Criar Meu Primeiro Chatbot
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {chatbots.map((bot) => (
                <div
                  key={bot.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl bg-accent/50 hover:bg-accent transition-smooth gap-3 sm:gap-4 cursor-pointer"
                  onClick={() => navigate(`/bot-builder?id=${bot.id}`)}
                >
                  <div className="flex items-center gap-3 sm:gap-4 flex-1">
                    <div className="bg-primary/10 p-2 sm:p-3 rounded-xl">
                      <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm sm:text-base">{bot.name}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {bot.description || "Sem descrição"}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          🔗 {bot.button_clicks?.[0]?.count || 0} cliques em links
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
                    <span
                      className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium flex-1 sm:flex-none text-center ${
                        bot.is_active
                          ? "bg-success/20 text-success"
                          : "bg-warning/20 text-warning"
                      }`}
                    >
                      {bot.is_active ? "Ativo" : "Inativo"}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => handleCopyLink(bot.id, e)}
                      title="Copiar link do chatbot"
                    >
                      <Link2 className="w-4 h-4 sm:mr-2" />
                      <span className="hidden sm:inline">Link</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => handleEdit(bot.id, e)}
                    >
                      <Pencil className="w-4 h-4 sm:mr-2" />
                      <span className="hidden sm:inline">Editar</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingId(bot.id);
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

        {/* AI Agents Section */}
        <Card className="p-4 sm:p-6 mt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold">Meus Agentes IA</h2>
            <Button onClick={() => navigate("/ai-agent")} size="sm" className="w-full sm:w-auto">
              <Sparkles className="w-4 h-4 mr-2" />
              Criar Agente IA
            </Button>
          </div>

          {aiAgents.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-primary/10 p-6 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Nenhum agente IA criado ainda</h3>
              <p className="text-muted-foreground mb-6">
                Crie seu primeiro agente inteligente para automatizar atendimentos
              </p>
              <Button onClick={() => navigate("/ai-agent")} className="gradient-primary">
                <Sparkles className="w-4 h-4 mr-2" />
                Criar Meu Primeiro Agente
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
                      <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
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

          <TabsContent value="clients">
            {hasFeature('chatbot_conversations') ? (
              <ChatbotConversations />
            ) : (
              <Card className="p-12 text-center">
                <h3 className="text-xl font-bold mb-2">Recurso não disponível</h3>
                <p className="text-muted-foreground mb-4">
                  Faça upgrade do seu plano para acessar as conversas dos chatbots
                </p>
                <Button onClick={() => navigate('/dashboard?tab=plan')} className="gradient-primary">
                  Ver Planos
                </Button>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="tools">
            {hasFeature('whatsapp_link') ? (
              <WhatsAppLinkGenerator />
            ) : (
              <Card className="p-12 text-center">
                <h3 className="text-xl font-bold mb-2">Recurso não disponível</h3>
                <p className="text-muted-foreground mb-4">
                  Faça upgrade do seu plano para gerar links do WhatsApp
                </p>
                <Button onClick={() => navigate('/dashboard?tab=plan')} className="gradient-primary">
                  Ver Planos
                </Button>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="qrcode">
            <QRCodeGenerator />
          </TabsContent>

          <TabsContent value="management">
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
            ) : selectedChatbotForManagement ? (
              <div>
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedChatbotForManagement(null)}
                  className="mb-4"
                >
                  ← Voltar para lista de chatbots
                </Button>
                <ChatbotManagementPanel 
                  chatbot={selectedChatbotForManagement}
                />
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Gestão de Agentes</CardTitle>
                  <CardDescription>
                    Selecione um agente para gerenciar agendamentos e pedidos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {aiAgents.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground mb-4">
                        Você ainda não tem agentes IA criados
                      </p>
                      <Button onClick={() => handleTabChange('agentes')}>
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
          </TabsContent>

          <TabsContent value="linkbio">
            <LinkBioCreator />
          </TabsContent>

          <TabsContent value="cloner">
            {hasFeature('page_cloner') ? (
              <PageCloner />
            ) : (
              <Card className="p-12 text-center">
                <h3 className="text-xl font-bold mb-2">Recurso não disponível</h3>
                <p className="text-muted-foreground mb-4">
                  Faça upgrade do seu plano para clonar páginas
                </p>
                <Button onClick={() => navigate('/dashboard?tab=plan')} className="gradient-primary">
                  Ver Planos
                </Button>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="crm">
            {hasFeature('crm_contacts') ? (
              <CRMContacts />
            ) : (
              <Card className="p-12 text-center">
                <h3 className="text-xl font-bold mb-2">Recurso não disponível</h3>
                <p className="text-muted-foreground mb-4">
                  Faça upgrade do seu plano para acessar o CRM
                </p>
                <Button onClick={() => navigate('/dashboard?tab=plan')} className="gradient-primary">
                  Ver Planos
                </Button>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="shortlinks">
            {hasFeature('link_shortener') ? (
              <LinkShortener />
            ) : (
              <Card className="p-12 text-center">
                <h3 className="text-xl font-bold mb-2">Recurso não disponível</h3>
                <p className="text-muted-foreground mb-4">
                  Faça upgrade do seu plano para encurtar links
                </p>
                <Button onClick={() => navigate('/dashboard?tab=plan')} className="gradient-primary">
                  Ver Planos
                </Button>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="support">
            {hasFeature('ticket_system') ? (
              <TicketSystem />
            ) : (
              <Card className="p-12 text-center">
                <h3 className="text-xl font-bold mb-2">Recurso não disponível</h3>
                <p className="text-muted-foreground mb-4">
                  Faça upgrade do seu plano para acessar o suporte
                </p>
                <Button onClick={() => navigate('/dashboard?tab=plan')} className="gradient-primary">
                  Ver Planos
                </Button>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="leads">
            {hasFeature('chatbot_conversations') ? (
              <CapturedLeads />
            ) : (
              <Card className="p-12 text-center">
                <h3 className="text-xl font-bold mb-2">Recurso não disponível</h3>
                <p className="text-muted-foreground mb-4">
                  Faça upgrade do seu plano para acessar leads capturados
                </p>
                <Button onClick={() => navigate('/dashboard?tab=plan')} className="gradient-primary">
                  Ver Planos
                </Button>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="chatbots">
            <MyChatbots 
              onManage={(chatbot) => {
                setSelectedChatbotForManagement(chatbot);
                navigate('/dashboard?tab=management');
              }}
            />
          </TabsContent>

          <TabsContent value="ai-agents">
            <MyAIAgents 
              onManage={(agent) => {
                setSelectedAgentForManagement(agent);
                navigate('/dashboard?tab=management');
              }}
            />
          </TabsContent>


          {/* Chatbot Management Tabs */}
          <TabsContent value="chatbot-analytics">
            {selectedChatbotForManagement ? (
              <ChatbotAnalyticsPanel chatbotId={selectedChatbotForManagement.id} />
            ) : (
              <Card><CardContent className="p-8 text-center">Selecione um chatbot primeiro</CardContent></Card>
            )}
          </TabsContent>

          <TabsContent value="chatbot-customers">
            {selectedChatbotForManagement ? (
              <ChatbotCustomersPanel chatbotId={selectedChatbotForManagement.id} />
            ) : (
              <Card><CardContent className="p-8 text-center">Selecione um chatbot primeiro</CardContent></Card>
            )}
          </TabsContent>

          <TabsContent value="chatbot-conversations">
            {selectedChatbotForManagement ? (
              <ChatbotConversationsPanel chatbotId={selectedChatbotForManagement.id} />
            ) : (
              <Card><CardContent className="p-8 text-center">Selecione um chatbot primeiro</CardContent></Card>
            )}
          </TabsContent>

          <TabsContent value="chatbot-products">
            {selectedChatbotForManagement ? (
              <ChatbotProductsPanel chatbotId={selectedChatbotForManagement.id} />
            ) : (
              <Card><CardContent className="p-8 text-center">Selecione um chatbot primeiro</CardContent></Card>
            )}
          </TabsContent>

          <TabsContent value="chatbot-appointments">
            {selectedChatbotForManagement ? (
              <ChatbotAppointmentsPanel chatbotId={selectedChatbotForManagement.id} />
            ) : (
              <Card><CardContent className="p-8 text-center">Selecione um chatbot primeiro</CardContent></Card>
            )}
          </TabsContent>

          <TabsContent value="chatbot-orders">
            {selectedChatbotForManagement ? (
              <ChatbotOrdersPanel chatbotId={selectedChatbotForManagement.id} />
            ) : (
              <Card><CardContent className="p-8 text-center">Selecione um chatbot primeiro</CardContent></Card>
            )}
          </TabsContent>

          <TabsContent value="chatbot-financial">
            {selectedChatbotForManagement ? (
              <ChatbotFinancialPanel chatbotId={selectedChatbotForManagement.id} />
            ) : (
              <Card><CardContent className="p-8 text-center">Selecione um chatbot primeiro</CardContent></Card>
            )}
          </TabsContent>

          <TabsContent value="chatbot-schedule">
            {selectedChatbotForManagement ? (
              <ChatbotSchedulePanel chatbotId={selectedChatbotForManagement.id} />
            ) : (
              <Card><CardContent className="p-8 text-center">Selecione um chatbot primeiro</CardContent></Card>
            )}
          </TabsContent>

          <TabsContent value="chatbot-automations">
            {selectedChatbotForManagement ? (
              <ChatbotAutomationsPanel chatbotId={selectedChatbotForManagement.id} />
            ) : (
              <Card><CardContent className="p-8 text-center">Selecione um chatbot primeiro</CardContent></Card>
            )}
          </TabsContent>

          <TabsContent value="chatbot-reviews">
            {selectedChatbotForManagement ? (
              <ChatbotReviewsPanel chatbotId={selectedChatbotForManagement.id} />
            ) : (
              <Card><CardContent className="p-8 text-center">Selecione um chatbot primeiro</CardContent></Card>
            )}
          </TabsContent>

          <TabsContent value="chatbot-notifications">
            {selectedChatbotForManagement ? (
              <ChatbotNotificationsPanel chatbotId={selectedChatbotForManagement.id} />
            ) : (
              <Card><CardContent className="p-8 text-center">Selecione um chatbot primeiro</CardContent></Card>
            )}
          </TabsContent>

          <TabsContent value="chatbot-reports">
            {selectedChatbotForManagement ? (
              <ChatbotReportsPanel chatbotId={selectedChatbotForManagement.id} />
            ) : (
              <Card><CardContent className="p-8 text-center">Selecione um chatbot primeiro</CardContent></Card>
            )}
          </TabsContent>

          {/* Agent Management Tabs */}
          <TabsContent value="agent-analytics">
            {selectedAgentForManagement ? (
              <AgentAnalyticsPanel agentId={selectedAgentForManagement.id} />
            ) : (
              <Card><CardContent className="p-8 text-center">Selecione um agente primeiro</CardContent></Card>
            )}
          </TabsContent>

          <TabsContent value="agent-customers">
            {selectedAgentForManagement ? (
              <AgentCustomersPanel agentId={selectedAgentForManagement.id} />
            ) : (
              <Card><CardContent className="p-8 text-center">Selecione um agente primeiro</CardContent></Card>
            )}
          </TabsContent>

          <TabsContent value="agent-conversations">
            {selectedAgentForManagement ? (
              <AgentConversationsPanel agentId={selectedAgentForManagement.id} />
            ) : (
              <Card><CardContent className="p-8 text-center">Selecione um agente primeiro</CardContent></Card>
            )}
          </TabsContent>

          <TabsContent value="agent-products">
            {selectedAgentForManagement ? (
              <AgentProductsPanel agentId={selectedAgentForManagement.id} />
            ) : (
              <Card><CardContent className="p-8 text-center">Selecione um agente primeiro</CardContent></Card>
            )}
          </TabsContent>

          <TabsContent value="agent-appointments">
            {selectedAgentForManagement ? (
              <AgentAppointmentsPanel agentId={selectedAgentForManagement.id} />
            ) : (
              <Card><CardContent className="p-8 text-center">Selecione um agente primeiro</CardContent></Card>
            )}
          </TabsContent>

          <TabsContent value="agent-orders">
            {selectedAgentForManagement ? (
              <AgentOrdersPanel agentId={selectedAgentForManagement.id} />
            ) : (
              <Card><CardContent className="p-8 text-center">Selecione um agente primeiro</CardContent></Card>
            )}
          </TabsContent>

          <TabsContent value="agent-financial">
            {selectedAgentForManagement ? (
              <AgentFinancialPanel agentId={selectedAgentForManagement.id} />
            ) : (
              <Card><CardContent className="p-8 text-center">Selecione um agente primeiro</CardContent></Card>
            )}
          </TabsContent>

          <TabsContent value="agent-schedule">
            {selectedAgentForManagement ? (
              <AgentSchedulePanel agentId={selectedAgentForManagement.id} />
            ) : (
              <Card><CardContent className="p-8 text-center">Selecione um agente primeiro</CardContent></Card>
            )}
          </TabsContent>

          <TabsContent value="agent-automations">
            {selectedAgentForManagement ? (
              <AgentAutomationsPanel agentId={selectedAgentForManagement.id} />
            ) : (
              <Card><CardContent className="p-8 text-center">Selecione um agente primeiro</CardContent></Card>
            )}
          </TabsContent>

          <TabsContent value="agent-reviews">
            {selectedAgentForManagement ? (
              <AgentReviewsPanel agentId={selectedAgentForManagement.id} />
            ) : (
              <Card><CardContent className="p-8 text-center">Selecione um agente primeiro</CardContent></Card>
            )}
          </TabsContent>

          <TabsContent value="agent-notifications">
            {selectedAgentForManagement ? (
              <AgentNotificationsPanel agentId={selectedAgentForManagement.id} />
            ) : (
              <Card><CardContent className="p-8 text-center">Selecione um agente primeiro</CardContent></Card>
            )}
          </TabsContent>

          <TabsContent value="agent-reports">
            {selectedAgentForManagement ? (
              <AgentReportsPanel agentId={selectedAgentForManagement.id} />
            ) : (
              <Card><CardContent className="p-8 text-center">Selecione um agente primeiro</CardContent></Card>
            )}
          </TabsContent>

          <TabsContent value="voucher">
            <VoucherRedemption />
          </TabsContent>

          <TabsContent value="plan">
            <MyPlanSection />
          </TabsContent>
        </Tabs>
      </main>

      {/* Delete Confirmation Dialogs */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Chatbot</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este chatbot? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
    </SidebarProvider>
    </>
  );
};

export default Dashboard;
