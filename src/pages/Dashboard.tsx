import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, Zap, MessageSquare, Settings, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState({
    totalBots: 0,
    activeConnections: 0,
    messagesThisMonth: 0,
  });
  const [chatbots, setChatbots] = useState<any[]>([]);

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
    await signOut();
    toast({
      title: "Logout realizado",
      description: "Até logo!",
    });
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-xl">
              <Bot className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Bot Reals Zapp</h1>
              <p className="text-sm text-muted-foreground">Dashboard do Usuário</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate("/settings")}>
              <Settings className="w-4 h-4 mr-2" />
              Configurações
            </Button>
            <Button
              onClick={handleLogout}
              variant="ghost"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 hover:shadow-lg transition-smooth">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-primary/10 p-3 rounded-xl">
                <Bot className="w-6 h-6 text-primary" />
              </div>
            </div>
            <h3 className="text-3xl font-bold mb-1">{stats.totalBots}</h3>
            <p className="text-muted-foreground">Chatbots Criados</p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-smooth">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-success/10 p-3 rounded-xl">
                <Zap className="w-6 h-6 text-success" />
              </div>
            </div>
            <h3 className="text-3xl font-bold mb-1">{stats.activeConnections}</h3>
            <p className="text-muted-foreground">WhatsApp Conectados</p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-smooth">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-info/10 p-3 rounded-xl">
                <MessageSquare className="w-6 h-6 text-info" />
              </div>
            </div>
            <h3 className="text-3xl font-bold mb-1">{stats.messagesThisMonth}</h3>
            <p className="text-muted-foreground">Mensagens Este Mês</p>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="p-6 glass hover:shadow-glow transition-smooth cursor-pointer" onClick={() => navigate("/bot-builder")}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold mb-2">Criar Chatbot</h3>
                <p className="text-muted-foreground mb-4">
                  Automação simples para seu WhatsApp
                </p>
              </div>
              <div className="bg-primary/10 p-4 rounded-2xl">
                <Bot className="w-10 h-10 text-primary" />
              </div>
            </div>
            <Button className="w-full mt-4 gradient-primary shadow-glow">
              Criar Agora
            </Button>
          </Card>

          <Card className="p-6 glass hover:shadow-glow transition-smooth cursor-pointer" onClick={() => navigate("/whatsapp-connect")}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold mb-2">Conectar WhatsApp</h3>
                <p className="text-muted-foreground mb-4">
                  Conecte seu número via QR Code
                </p>
              </div>
              <div className="bg-primary/10 p-4 rounded-2xl">
                <Zap className="w-10 h-10 text-primary" />
              </div>
            </div>
            <Button className="w-full mt-4 gradient-primary shadow-glow">
              Conectar Agora
            </Button>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Meus Chatbots</h2>
            <Button onClick={() => navigate("/bot-builder")}>
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
                  className="flex items-center justify-between p-4 rounded-xl bg-accent/50 hover:bg-accent transition-smooth cursor-pointer"
                  onClick={() => navigate("/bot-builder")}
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/10 p-3 rounded-xl">
                      <Bot className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{bot.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {bot.description || "Sem descrição"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        bot.is_active
                          ? "bg-success/20 text-success"
                          : "bg-warning/20 text-warning"
                      }`}
                    >
                      {bot.is_active ? "Ativo" : "Inativo"}
                    </span>
                    <Button variant="ghost" size="sm">
                      Editar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
