import { lazy, Suspense, useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MessageSquareText, Settings2, Loader2, MessageCircleMore } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { MyAIAgents } from "@/components/MyAIAgents";

const AgentManagementPanel = lazy(() => import("@/components/AgentManagementPanel"));

type ManagedAgent = { id: string; name: string; niche?: string | null };

export function ChatOnlineWorkspace({ entityId }: { entityId: string }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const agentId = params.get("agentId");
  const agentView = params.get("agentView");
  const [managedAgent, setManagedAgent] = useState<ManagedAgent | null>(null);
  const [loadingAgent, setLoadingAgent] = useState(false);
  const [loadError, setLoadError] = useState("");

  // Reload/back-button safe: rehydrate the chat management screen from the URL.
  // The ownership check prevents accidentally opening another user's agent.
  useEffect(() => {
    if (!agentId) {
      setManagedAgent(null);
      setLoadError("");
      setLoadingAgent(false);
      return;
    }
    if (!user?.id) return;

    let live = true;
    setLoadingAgent(true);
    setLoadError("");
    supabase.from("ai_agents")
      .select("id,name,niche")
      .eq("id", agentId)
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!live) return;
        if (error || !data) {
          setManagedAgent(null);
          setLoadError(error?.message || "Chat não encontrado ou sem permissão para gerenciar.");
        } else {
          setManagedAgent(data);
        }
        setLoadingAgent(false);
      });
    return () => { live = false; };
  }, [agentId, user?.id]);

  const openManagement = (agent: ManagedAgent, view?: string) => {
    const next = new URLSearchParams(params);
    next.set("entity", entityId);
    next.set("tab", "chat-online");
    next.set("agentId", agent.id);
    if (view && ["conversations", "forms", "analytics"].includes(view)) {
      next.set("agentView", view);
    } else {
      next.delete("agentView");
    }
    setManagedAgent(agent);
    setLoadError("");
    setParams(next);
  };

  const backToList = () => {
    const next = new URLSearchParams(params);
    next.delete("agentId");
    next.delete("agentView");
    setParams(next);
    setManagedAgent(null);
  };

  const configureAgent = (id: string) => {
    navigate("/chat-online?id=" + encodeURIComponent(id) +
      "&entity=" + encodeURIComponent(entityId) + "&returnTo=manage");
  };

  if (agentId) {
    return (
      <div className="hub-chat-management space-y-4">
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-cyan-500/25 bg-cyan-950/20 p-3 sm:p-4">
          <Button variant="outline" size="sm" className="shrink-0 gap-2" onClick={backToList}>
            <ArrowLeft size={17}/> Meus chats
          </Button>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] uppercase tracking-widest text-cyan-400">Central de atendimento</p>
            <p className="truncate text-base font-semibold">{managedAgent?.name || "Carregando chat..."}</p>
          </div>
          <Button size="sm" variant="outline" className="gap-2" disabled={!managedAgent || loadingAgent}
            onClick={() => configureAgent(agentId)}>
            <Settings2 size={16}/> Configurações
          </Button>
        </div>
        {loadingAgent && !managedAgent ? (
          <div className="flex min-h-48 items-center justify-center gap-3 text-cyan-200" role="status">
            <Loader2 className="animate-spin" size={19}/> Carregando atendimento...
          </div>
        ) : loadError ? (
          <div role="alert" className="space-y-3 rounded-xl border border-destructive/40 p-5 text-sm">
            <p>{loadError}</p><Button variant="outline" onClick={backToList}>Voltar para meus chats</Button>
          </div>
        ) : managedAgent ? (
          <Suspense fallback={<div role="status" className="flex min-h-48 items-center justify-center gap-2 text-cyan-200"><Loader2 size={18} className="animate-spin"/> Preparando conversas...</div>}>
            <AgentManagementPanel
              key={managedAgent.id + "-" + (agentView || "menu")}
              agentId={managedAgent.id}
              agentName={managedAgent.name}
            />
          </Suspense>
        ) : null}
      </div>
    );
  }

  return (
    <div className="hub-chat-manager space-y-5">
      <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/15 p-4 sm:p-5">
        <div className="flex items-center gap-2 text-cyan-300"><MessageCircleMore size={19}/><strong>Seus chats online</strong></div>
        <p className="mt-2 text-sm text-muted-foreground">
          Em <strong>Gerenciar atendimento</strong>, acesse conversas, formulários e relatórios.
          Use o ícone de engrenagem apenas para editar as configurações do chat.
        </p>
      </div>
      <MyAIAgents entityId={entityId} onManage={openManagement} />
    </div>
  );
}

export default ChatOnlineWorkspace;
