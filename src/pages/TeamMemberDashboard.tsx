import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Users, LogOut, ArrowLeft } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTeamMember } from "@/contexts/TeamMemberContext";

import { AgendaPanel } from "@/components/AgendaPanel";
import { ClientsManagementPanel } from "@/components/ClientsManagementPanel";
import { FinancialManagementPanel } from "@/components/FinancialManagementPanel";
import { AdsManagementPanel } from "@/components/AdsManagementPanel";
import { TaskManagerContainer } from "@/components/tasks/TaskManagerContainer";
import { ChatbotConversationsPanel } from "@/components/ChatbotConversationsPanel";
import { GlobalChatNotification } from "@/components/GlobalChatNotification";
import AgentConversationsPanel from "@/components/AgentConversationsPanel";

type TeamModuleKey = "agenda" | "crm" | "financial" | "ads" | "tasks" | "chatbots" | "ai_agents";

const MODULES: Array<{ key: TeamModuleKey; title: string; description: string }> = [
  { key: "agenda", title: "Agenda", description: "Gerencie eventos e lembretes" },
  { key: "crm", title: "Clientes", description: "Gerencie clientes e contatos" },
  { key: "financial", title: "Financeiro", description: "Controle financeiro" },
  { key: "ads", title: "Anúncios", description: "Gestão de anúncios" },
  { key: "tasks", title: "Tarefas", description: "Organizador de tarefas" },
  { key: "chatbots", title: "Chat Online (Chatbot)", description: "Conversas do chatbot" },
  { key: "ai_agents", title: "Chat Online", description: "Chats de atendimento online" },
];

export default function TeamMemberDashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tab = (searchParams.get("tab") || "").toLowerCase();

  const { isTeamMember, teamMember, canAccessModule, getAllowedIds, logout } = useTeamMember();

  const allowedModules = useMemo(() => {
    return MODULES.filter((m) => canAccessModule(m.key));
  }, [canAccessModule]);

  const activeTab = (tab || (allowedModules[0]?.key ?? "")) as TeamModuleKey | "";

  const handleLogout = async () => {
    await logout();
    navigate("/team-login", { replace: true });
  };

  const handleBackToModules = () => {
    navigate("/team-dashboard", { replace: true });
  };

  if (!isTeamMember || !teamMember) {
    // fallback: if someone opens this route without a team session
    navigate("/team-login", { replace: true });
    return null;
  }

  const renderModule = () => {
    if (!activeTab) return null;
    if (!canAccessModule(activeTab)) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Acesso restrito</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            Você não tem permissão para acessar este recurso.
          </CardContent>
        </Card>
      );
    }

    // Get allowed IDs for current module
    const allowedIds = getAllowedIds(activeTab);
    const adminUserId = teamMember.adminUserId;

    switch (activeTab) {
      case "agenda":
        return <AgendaPanel teamContext={{ adminUserId, allowedIds }} />;
      case "crm":
        return <ClientsManagementPanel teamContext={{ adminUserId, allowedIds }} />;
      case "financial":
        return <FinancialManagementPanel teamContext={{ adminUserId, allowedIds }} />;
      case "ads":
        return <AdsManagementPanel teamContext={{ adminUserId, allowedIds }} />;
      case "tasks":
        return <TaskManagerContainer teamContext={{ adminUserId, allowedIds }} />;
      case "chatbots":
        // For chatbots, allowedIds contains chatbot IDs
        // If only one chatbot is allowed, pass it directly
        if (allowedIds.length === 1) {
          return <ChatbotConversationsPanel chatbotId={allowedIds[0]} />;
        }
        // Otherwise show all allowed chatbots (need to filter in component)
        return <ChatbotConversationsPanel teamContext={{ adminUserId, allowedIds }} />;
      case "ai_agents":
        // For AI agents (Chat Online), use the AgentConversationsPanel
        if (allowedIds.length === 1) {
          return <AgentConversationsPanel agentId={allowedIds[0]} />;
        }
        // If multiple agents, render the first one (or we could show a selector)
        return allowedIds.length > 0 
          ? <AgentConversationsPanel agentId={allowedIds[0]} />
          : null;
      default:
        return null;
    }
  };

  const showGrid = !tab;

  return (
    <>
      <GlobalChatNotification />
      <div className="min-h-screen bg-background">
      <Helmet>
        <title>Painel do Membro da Equipe | Out App</title>
        <meta
          name="description"
          content="Painel do membro da equipe com acesso apenas aos recursos delegados."
        />
        <link rel="canonical" href={`${window.location.origin}/team-dashboard`} />
      </Helmet>

      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-semibold truncate">Painel do Membro da Equipe</h1>
              <p className="text-xs text-muted-foreground truncate">
                Você está acessando a equipe de {teamMember.adminName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!showGrid && (
              <Button variant="outline" onClick={handleBackToModules} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            )}
            <Button variant="ghost" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {showGrid ? (
          <section aria-label="Recursos delegados">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {allowedModules.map((m) => (
                <Card key={m.key} className="hover:border-primary/40 transition-colors">
                  <CardHeader>
                    <CardTitle className="text-base">{m.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">{m.description}</p>
                    <Button
                      className="w-full"
                      onClick={() => navigate(`/team-dashboard?tab=${m.key}`)}
                    >
                      Acessar
                    </Button>
                  </CardContent>
                </Card>
              ))}

              {allowedModules.length === 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Nenhum recurso delegado</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Peça ao administrador para delegar pelo menos um módulo.
                  </CardContent>
                </Card>
              )}
            </div>
          </section>
        ) : (
          <section aria-label="Recurso delegado">
            {renderModule()}
          </section>
        )}
      </main>
      </div>
    </>
  );
}
