import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Bell, CheckCircle, Circle, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export const ChatbotNotificationsPanel = ({ chatbotId }: { chatbotId: string }) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, [chatbotId]);

  const loadNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('chatbot_notifications')
        .select('*')
        .eq('chatbot_id', chatbotId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading notifications:', error);
      setLoading(false);
    }
  };

  const toggleReadStatus = async (e: React.MouseEvent, notificationId: string, currentStatus: boolean) => {
    e.stopPropagation();
    
    try {
      await supabase
        .from('chatbot_notifications')
        .update({ is_read: !currentStatus })
        .eq('id', notificationId);
      
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, is_read: !currentStatus } : n
      ));
      
      toast.success(`Notificação marcada como ${!currentStatus ? 'lida' : 'não lida'}`);
    } catch (error) {
      console.error('Error toggling read status:', error);
      toast.error('Erro ao alterar status');
    }
  };

  const handleDelete = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    
    try {
      await supabase
        .from('chatbot_notifications')
        .delete()
        .eq('id', notificationId);
      
      setNotifications(notifications.filter(n => n.id !== notificationId));
      toast.success('Notificação removida');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Erro ao remover notificação');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Bell className="h-5 w-5" />
        Central de Notificações
      </h3>
      <div className="grid gap-4">
        {notifications.map((notification) => (
          <Card 
            key={notification.id} 
            className={`p-4 transition-all group ${!notification.is_read ? 'border-primary border-l-4' : ''}`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium flex items-center gap-2">
                  {notification.title}
                  {!notification.is_read && (
                    <span className="inline-block w-2 h-2 bg-primary rounded-full"></span>
                  )}
                </h4>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(notification.created_at), { 
                      addSuffix: true,
                      locale: ptBR 
                    })}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => toggleReadStatus(e, notification.id, notification.is_read)}
                    title={notification.is_read ? "Marcar como não lida" : "Marcar como lida"}
                  >
                    {notification.is_read ? (
                      <Circle className="h-4 w-4" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => handleDelete(e, notification.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{notification.message}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};