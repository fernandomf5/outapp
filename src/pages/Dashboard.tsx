import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, Zap, Users, TrendingUp, Plus, MessageSquare, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats] = useState({
    totalBots: 3,
    activeConnections: 2,
    messagesThisMonth: 1247,
    responseRate: 94,
  });

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
              onClick={() => navigate("/auth")}
              variant="ghost"
            >
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
              <span className="text-sm font-medium text-primary">+2 este mês</span>
            </div>
            <h3 className="text-3xl font-bold mb-1">{stats.totalBots}</h3>
            <p className="text-muted-foreground">Chatbots Criados</p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-smooth">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-success/10 p-3 rounded-xl">
                <Zap className="w-6 h-6 text-success" />
              </div>
              <span className="text-sm font-medium text-success">Ativo</span>
            </div>
            <h3 className="text-3xl font-bold mb-1">{stats.activeConnections}</h3>
            <p className="text-muted-foreground">WhatsApp Conectados</p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-smooth">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-info/10 p-3 rounded-xl">
                <MessageSquare className="w-6 h-6 text-info" />
              </div>
              <span className="text-sm font-medium text-info">+18% vs mês anterior</span>
            </div>
            <h3 className="text-3xl font-bold mb-1">{stats.messagesThisMonth.toLocaleString()}</h3>
            <p className="text-muted-foreground">Mensagens Enviadas</p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-smooth">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-warning/10 p-3 rounded-xl">
                <TrendingUp className="w-6 h-6 text-warning" />
              </div>
              <span className="text-sm font-medium text-warning">Excelente</span>
            </div>
            <h3 className="text-3xl font-bold mb-1">{stats.responseRate}%</h3>
            <p className="text-muted-foreground">Taxa de Resposta</p>
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
                <div className="inline-flex items-center gap-2 text-primary font-semibold">
                  <Plus className="w-5 h-5" />
                  <span>R$ 49,90/mês</span>
                </div>
              </div>
              <div className="bg-primary/10 p-4 rounded-2xl">
                <Bot className="w-10 h-10 text-primary" />
              </div>
            </div>
            <Button className="w-full mt-4 gradient-primary shadow-glow">
              Começar Agora
            </Button>
          </Card>

          <Card className="p-6 glass hover:shadow-glow transition-smooth cursor-pointer" onClick={() => navigate("/ai-agent")}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold mb-2">Criar Agente IA</h3>
                <p className="text-muted-foreground mb-4">
                  Atendimento inteligente com IA avançada
                </p>
                <div className="inline-flex items-center gap-2 text-primary font-semibold">
                  <Plus className="w-5 h-5" />
                  <span>R$ 89,90/mês</span>
                </div>
              </div>
              <div className="bg-primary/10 p-4 rounded-2xl">
                <Zap className="w-10 h-10 text-primary" />
              </div>
            </div>
            <Button className="w-full mt-4 gradient-primary shadow-glow">
              Começar Agora
            </Button>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Meus Chatbots</h2>
            <Button onClick={() => navigate("/whatsapp-connect")}>
              <Plus className="w-4 h-4 mr-2" />
              Conectar WhatsApp
            </Button>
          </div>

          <div className="space-y-4">
            {[
              { name: "Atendimento Geral", status: "Ativo", messages: 342, lastUpdate: "Há 2 horas" },
              { name: "Vendas Premium", status: "Ativo", messages: 189, lastUpdate: "Há 5 horas" },
              { name: "Suporte Técnico", status: "Pausado", messages: 716, lastUpdate: "Há 1 dia" },
            ].map((bot, index) => (
              <div
                key={index}
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
                      {bot.messages} mensagens • {bot.lastUpdate}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      bot.status === "Ativo"
                        ? "bg-success/20 text-success"
                        : "bg-warning/20 text-warning"
                    }`}
                  >
                    {bot.status}
                  </span>
                  <Button variant="ghost" size="sm">
                    Editar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
