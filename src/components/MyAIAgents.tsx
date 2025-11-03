import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Pencil, Trash2, Copy, ExternalLink, Settings, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AgentNotificationsPanel from "@/components/AgentNotificationsPanel";

interface MyAIAgentsProps {
  onManage?: (agent: { id: string; name: string; niche: string }) => void;
}

export const MyAIAgents = ({ onManage }: MyAIAgentsProps = {}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [agents, setAgents] = useState<any[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Record<string, { appointments: number; orders: number; messages: number }>>({});
  const [selectedAgentForNotifications, setSelectedAgentForNotifications] = useState<string | null>(null);

  useEffect(() => {
    fetchAgents();

    // Subscrever mudanças em tempo real
    const subscription = supabase
      .channel('my_agents_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'ai_agents',
        filter: `user_id=eq.${user?.id}`
      }, () => {
        fetchAgents();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const fetchAgents = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setAgents(data);
      fetchNotifications(data.map(agent => agent.id));
    }
    setLoading(false);
  };

  const fetchNotifications = async (agentIds: string[]) => {
    if (agentIds.length === 0) return;

    // Buscar agendamentos pendentes
    const { data: appointmentsData } = await supabase
      .from('agent_appointments')
      .select('agent_id')
      .in('agent_id', agentIds)
      .eq('status', 'pending');

    // Buscar pedidos pendentes
    const { data: ordersData } = await supabase
      .from('agent_orders')
      .select('agent_id')
      .in('agent_id', agentIds)
      .eq('status', 'pending');

    // Buscar notificações não lidas
    const { data: messagesData } = await supabase
      .from('agent_notifications')
      .select('agent_id')
      .in('agent_id', agentIds)
      .eq('is_read', false);

    // Contar notificações por agente
    const notifCounts: Record<string, { appointments: number; orders: number; messages: number }> = {};
    
    agentIds.forEach(id => {
      notifCounts[id] = { appointments: 0, orders: 0, messages: 0 };
    });

    appointmentsData?.forEach(item => {
      notifCounts[item.agent_id].appointments++;
    });

    ordersData?.forEach(item => {
      notifCounts[item.agent_id].orders++;
    });

    messagesData?.forEach(item => {
      notifCounts[item.agent_id].messages++;
    });

    setNotifications(notifCounts);
  };

  const handleEdit = (agentId: string) => {
    navigate(`/ai-agent?id=${agentId}`);
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    const { error } = await supabase
      .from('ai_agents')
      .delete()
      .eq('id', deletingId);

    if (error) {
      toast({
        title: t('error'),
        description: error.message,
        variant: "destructive",
      });
    } else {
      setAgents(agents.filter(agent => agent.id !== deletingId));
      toast({
        title: t('ai_agent_deleted'),
        description: t('ai_agent_deleted_desc'),
      });
    }
    setDeletingId(null);
  };

  const handleCopyLink = (agentId: string, agentName: string) => {
    const slug = (agentName || '')
      .normalize('NFD').replace(/\p{Diacritic}/gu, '')
      .toLowerCase().trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    const link = `${window.location.origin}/agent-auth/${agentId}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copiado! 🔗",
      description: "O link do agente IA foi copiado para a área de transferência.",
    });
  };

  const handleOpenChat = (agentId: string, agentName: string) => {
    const slug = (agentName || '')
      .normalize('NFD').replace(/\p{Diacritic}/gu, '')
      .toLowerCase().trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    window.open(`/agent-auth/${agentId}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (agents.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Sparkles className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-xl font-semibold mb-2">{t('no_ai_agents')}</h3>
        <p className="text-muted-foreground mb-6">
          {t('no_ai_agents_desc')}
        </p>
        <Button onClick={() => navigate("/ai-agent")} className="mx-auto">
          <Sparkles className="w-4 h-4 mr-2" />
          {t('create_ai_agent')}
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{t('my_ai_agents')}</h2>
        <Button onClick={() => navigate("/ai-agent")}>
          <Sparkles className="w-4 h-4 mr-2" />
          {t('new_ai_agent')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent) => {
          const totalNotifications = (notifications[agent.id]?.appointments || 0) + (notifications[agent.id]?.orders || 0) + (notifications[agent.id]?.messages || 0);
          
          return (
          <Card key={agent.id} className="p-6 hover:shadow-lg transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-success/10 p-3 rounded-xl">
                <Sparkles className="w-6 h-6 text-success" />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(agent.id)}
                  title="Editar"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeletingId(agent.id)}
                  title="Excluir"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative"
                  onClick={() => setSelectedAgentForNotifications(agent.id)}
                  title="Notificações"
                >
                  <Bell className="w-4 h-4" />
                  {totalNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive rounded-full flex items-center justify-center text-[10px] text-white">
                      {totalNotifications}
                    </span>
                  )}
                </Button>
              </div>
            </div>

            <h3 className="text-lg font-semibold mb-2">{agent.name}</h3>
            {agent.description && (
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {agent.description}
              </p>
            )}

            <div className="flex items-center justify-between text-sm mb-4">
              <span className={`px-2 py-1 rounded-full ${agent.is_active ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                {agent.is_active ? t('chatbot_active') : t('chatbot_inactive')}
              </span>
              <span className="text-muted-foreground">
                {new Date(agent.created_at).toLocaleDateString('pt-BR')}
              </span>
            </div>

            <div className="mb-3">
              <span className="text-xs font-medium text-muted-foreground">{t('niche')}:</span>
              <span className="text-sm ml-2 capitalize">{agent.niche || t('not_defined')}</span>
            </div>

            <div className="space-y-2">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleCopyLink(agent.id, agent.name)}
                >
                  <Copy className="w-3 h-3 mr-2" />
                  {t('copy_link')}
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleOpenChat(agent.id, agent.name)}
                >
                  <ExternalLink className="w-3 h-3 mr-2" />
                  {t('open_chat')}
                </Button>
              </div>
              {onManage && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => onManage({ id: agent.id, name: agent.name, niche: agent.niche })}
                >
                  <Settings className="w-3 h-3 mr-2" />
                  Gerenciar Agente
                </Button>
              )}
            </div>
          </Card>
        );
        })}
      </div>

      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('delete_ai_agent')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('delete_ai_agent_confirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!selectedAgentForNotifications} onOpenChange={() => setSelectedAgentForNotifications(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Notificações do Agente</DialogTitle>
          </DialogHeader>
          {selectedAgentForNotifications && (
            <AgentNotificationsPanel agentId={selectedAgentForNotifications} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
