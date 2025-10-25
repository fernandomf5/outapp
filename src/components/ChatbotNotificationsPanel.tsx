import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

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

  const handleMarkAsRead = async (notificationId: string) => {
    await supabase
      .from('chatbot_notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
    
    setNotifications(notifications.map(n => 
      n.id === notificationId ? { ...n, is_read: true } : n
    ));
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
            className={`p-4 cursor-pointer transition-all ${!notification.is_read ? 'border-primary' : ''}`}
            onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium flex items-center gap-2">
                  {notification.title}
                  {!notification.is_read && (
                    <span className="inline-block w-2 h-2 bg-primary rounded-full"></span>
                  )}
                </h4>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(notification.created_at), { 
                    addSuffix: true,
                    locale: ptBR 
                  })}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{notification.message}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};