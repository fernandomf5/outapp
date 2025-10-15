import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, Zap, MessageSquare, Settings, LogOut, Pencil, Trash2, Sparkles, CreditCard, Link2, Copy } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { NotificationBell } from "@/components/NotificationBell";
import { TutorialVideos } from "@/components/TutorialVideos";
import { SubscriptionBanner } from "@/components/SubscriptionBanner";
import { MyPlanSection } from "@/components/MyPlanSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [searchParams] = useSearchParams();
  const [stats, setStats] = useState({
    totalBots: 0,
    activeConnections: 0,
    messagesThisMonth: 0,
  });
  const [chatbots, setChatbots] = useState<any[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      // Buscar chatbots do usuário
      const { data: botsData, error: botsError } = await supabase
        .from('chatbots')
        .select('*')
        .eq('user_id', user.id);

      if (!botsError && botsData) {
        setChatbots(botsData);
        
        // Buscar conexões ativas
        const { data: connectionsData } = await supabase
          .from('whatsapp_connections')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_connected', true);

        setStats({
          totalBots: botsData.length,
          activeConnections: connectionsData?.length || 0,
          messagesThisMonth: 0, // Este valor viria de uma tabela de mensagens quando implementada
        });
      }
    };

    fetchData();
  }, [user]);

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

  const handleCopyLink = (botId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const link = `${window.location.origin}/chat/${botId}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copiado! 🔗",
      description: "O link do chatbot foi copiado para a área de transferência.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-xl">
              <Bot className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">
                Olá, {user?.email?.split('@')[0] || 'Usuário'}! 👋
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">Que bom ver você por aqui!</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <NotificationBell />
            <Button variant="outline" onClick={() => navigate("/settings")} className="flex-1 sm:flex-none" size="sm">
              <Settings className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Configurações</span>
            </Button>
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="flex-1 sm:flex-none"
              size="sm"
            >
              <LogOut className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Subscription Banner */}
        <SubscriptionBanner />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger 
              value="plan" 
              className="flex items-center gap-2 data-[state=active]:bg-success data-[state=active]:text-white"
            >
              <CreditCard className="w-4 h-4" />
              Meu Plano
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
        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
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
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl bg-accent/50 hover:bg-accent transition-smooth cursor-pointer gap-3 sm:gap-4"
                  onClick={() => navigate("/bot-builder")}
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
          </TabsContent>

          <TabsContent value="plan">
            <MyPlanSection />
          </TabsContent>
        </Tabs>
      </main>

      {/* Delete Confirmation Dialog */}
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
    </div>
  );
};

export default Dashboard;
