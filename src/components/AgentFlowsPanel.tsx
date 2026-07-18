import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Workflow, Plus, Pencil, Trash2, Power } from "lucide-react";
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

interface AgentFlowsPanelProps {
  agentId: string;
}

export default function AgentFlowsPanel({ agentId }: AgentFlowsPanelProps) {
  const [flows, setFlows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadFlows();
  }, [agentId]);

  const loadFlows = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("agent_chat_flows")
      .select("*")
      .eq("agent_id", agentId)
      .order("created_at", { ascending: false });

    if (!error) setFlows(data || []);
    setLoading(false);
  };

  const handleToggle = async (flowId: string, isActive: boolean) => {
    // Se estiver ativando um fluxo, desativar a IA do agente
    if (isActive) {
      const { data: currentAgent } = await supabase
        .from("ai_agents")
        .select("config")
        .eq("id", agentId)
        .single();
      
      const config = { ...(currentAgent?.config as any || {}), ai_enabled: false };
      
      const { error: agentError } = await supabase
        .from("ai_agents")
        .update({ config })
        .eq("id", agentId);
        
      if (agentError) {
        console.error("Erro ao desativar IA:", agentError);
      }
    }

    const { error } = await supabase
      .from("agent_chat_flows")
      .update({ is_active: isActive })
      .eq("id", flowId);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      setFlows((prev) => prev.map((f) => (f.id === flowId ? { ...f, is_active: isActive } : f)));
      toast({ 
        title: isActive ? "Fluxo ativado ✅" : "Fluxo desativado",
        description: isActive ? "A Inteligência Artificial foi desativada para este agente." : undefined
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    const { error } = await supabase.from("agent_chat_flows").delete().eq("id", deletingId);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      setFlows((prev) => prev.filter((f) => f.id !== deletingId));
      toast({ title: "Fluxo excluído" });
    }
    setDeletingId(null);
  };

  const getNodeCount = (flow: any) => {
    const config = flow.config as any;
    return config?.nodes?.length || 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Workflow className="w-5 h-5 text-primary" />
            Fluxos de Atendimento
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Crie fluxos automáticos para agilizar o atendimento
          </p>
        </div>
        <Button onClick={() => navigate(`/agent-flow-builder?agentId=${agentId}`)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Fluxo
        </Button>
      </div>

      {flows.length === 0 ? (
        <Card className="p-12 text-center">
          <Workflow className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Nenhum fluxo criado</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Crie fluxos de atendimento automáticos com mensagens, botões, imagens e muito mais para agilizar suas conversas.
          </p>
          <Button onClick={() => navigate(`/agent-flow-builder?agentId=${agentId}`)}>
            <Plus className="w-4 h-4 mr-2" />
            Criar Primeiro Fluxo
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {flows.map((flow) => (
            <Card key={flow.id} className="p-5 hover:shadow-lg transition-all border-border/50">
              <div className="flex items-start justify-between mb-3">
                <div className="bg-primary/10 p-2.5 rounded-xl">
                  <Workflow className="w-5 h-5 text-primary" />
                </div>
                <div className="flex items-center gap-1">
                  <Switch
                    checked={flow.is_active}
                    onCheckedChange={(checked) => handleToggle(flow.id, checked)}
                  />
                  <Power className={`w-3.5 h-3.5 ${flow.is_active ? "text-green-500" : "text-muted-foreground"}`} />
                </div>
              </div>

              <h4 className="font-semibold text-base mb-1">{flow.name}</h4>
              {flow.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{flow.description}</p>
              )}

              <div className="flex items-center gap-2 mb-4">
                <Badge variant="secondary" className="text-xs">
                  {getNodeCount(flow)} blocos
                </Badge>
                <Badge variant={flow.is_active ? "default" : "outline"} className="text-xs">
                  {flow.is_active ? "Ativo" : "Inativo"}
                </Badge>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => navigate(`/agent-flow-builder?id=${flow.id}&agentId=${agentId}`)}
                >
                  <Pencil className="w-3.5 h-3.5 mr-1.5" />
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeletingId(flow.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir fluxo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O fluxo será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
