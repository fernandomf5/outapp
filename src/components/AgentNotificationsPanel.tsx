import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface AgentNotificationsPanelProps {
  agentId: string;
}

interface Notification {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  reference_id: string | null;
  is_read: boolean;
  created_at: string;
}

const notificationTypeLabels: Record<string, string> = {
  new_order: "Novo Pedido",
  new_appointment: "Novo Agendamento",
  new_message: "Nova Mensagem",
  new_review: "Nova Avaliação",
  payment_received: "Pagamento Recebido",
  appointment_reminder: "Lembrete de Agendamento"
};

const notificationTypeColors: Record<string, string> = {
  new_order: "bg-blue-500",
  new_appointment: "bg-green-500",
  new_message: "bg-purple-500",
  new_review: "bg-yellow-500",
  payment_received: "bg-emerald-500",
  appointment_reminder: "bg-orange-500"
};

export default function AgentNotificationsPanel({ agentId, onNavigate }: AgentNotificationsPanelProps & { onNavigate?: (tab: string, referenceId?: string) => void }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("unread");

  useEffect(() => {
    fetchNotifications();

    const channel = supabase
      .channel('agent-notifications-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_notifications',
          filter: `agent_id=eq.${agentId}`
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agentId]);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('agent_notifications')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('agent_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
      fetchNotifications();
    } catch (error) {
      console.error('Error marking as read:', error);
      toast.error('Erro ao marcar como lida');
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    
    if (onNavigate) {
      const tabMap: Record<string, string> = {
        new_order: 'orders',
        new_appointment: 'appointments',
        new_message: 'conversations',
        new_review: 'reviews',
        payment_received: 'financial',
      };
      
      const tab = tabMap[notification.notification_type];
      if (tab) {
        onNavigate(tab, notification.reference_id || undefined);
      }
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('agent_notifications')
        .update({ is_read: true })
        .eq('agent_id', agentId)
        .eq('is_read', false);

      if (error) throw error;
      fetchNotifications();
      toast.success('Todas as notificações marcadas como lidas');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Erro ao marcar todas como lidas');
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('agent_notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
      fetchNotifications();
      toast.success('Notificação removida');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Erro ao remover notificação');
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === "unread") return !n.is_read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return <div className="p-8 text-center">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Central de Notificações
            {unreadCount > 0 && (
              <Badge className="bg-red-500">{unreadCount}</Badge>
            )}
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant={filter === "unread" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("unread")}
            >
              Não Lidas
            </Button>
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              Todas
            </Button>
            {unreadCount > 0 && (
              <Button size="sm" onClick={markAllAsRead}>
                <CheckCheck className="h-4 w-4 mr-2" />
                Marcar todas como lidas
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {filter === "unread" ? "Nenhuma notificação não lida" : "Nenhuma notificação"}
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={`cursor-pointer transition-colors ${!notification.is_read ? "border-l-4 border-l-primary hover:bg-accent" : "hover:bg-accent/50"}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={notificationTypeColors[notification.notification_type] || "bg-gray-500"}>
                            {notificationTypeLabels[notification.notification_type] || notification.notification_type}
                          </Badge>
                          {!notification.is_read && (
                            <Badge variant="outline">Nova</Badge>
                          )}
                        </div>
                        <h4 className="font-medium mb-1">{notification.title}</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(notification.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
