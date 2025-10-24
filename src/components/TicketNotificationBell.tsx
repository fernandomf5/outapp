import { useState, useEffect } from "react";
import { Bell, MessageSquare, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface TicketNotification {
  id: string;
  ticket_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
  ticket?: {
    title: string;
    status: string;
  };
}

interface TicketNotificationBellProps {
  isAdmin?: boolean;
}

export const TicketNotificationBell = ({ isAdmin = false }: TicketNotificationBellProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<TicketNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      console.log('[TicketNotificationBell] Buscando notificações para user:', user.id);
      
      const { data, error } = await supabase
        .from('ticket_notifications')
        .select(`
          *,
          ticket:tickets(title, status)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      console.log('[TicketNotificationBell] Resultado:', { data, error, count: data?.length });

      if (error) {
        console.error('[TicketNotificationBell] Erro ao buscar notificações:', error);
      }

      if (!error && data) {
        setNotifications(data as unknown as TicketNotification[]);
        setUnreadCount(data.filter(n => !n.is_read).length);
        console.log('[TicketNotificationBell] Notificações carregadas:', data.length, 'Não lidas:', data.filter(n => !n.is_read).length);
      }
    };

    fetchNotifications();

    // Real-time subscription
    const channel = supabase
      .channel(`ticket_notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ticket_notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('[TicketNotificationBell] Evento realtime recebido:', payload);
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    await supabase
      .from('ticket_notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
  };

  const markAllAsRead = async () => {
    if (!user) return;
    
    await supabase
      .from('ticket_notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const handleNotificationClick = async (notification: TicketNotification) => {
    await markAsRead(notification.id);
    setIsOpen(false);
    
    if (isAdmin) {
      navigate(`/admin?tab=tickets&ticketId=${notification.ticket_id}`);
    } else {
      navigate(`/dashboard?tab=support&ticketId=${notification.ticket_id}`);
    }
  };

  const handleDeleteNotification = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const { error } = await supabase
      .from('ticket_notifications')
      .delete()
      .eq('id', notificationId);

    if (!error) {
      setNotifications(notifications.filter(n => n.id !== notificationId));
      if (notifications.find(n => n.id === notificationId && !n.is_read)) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative"
        >
          <MessageSquare className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-destructive"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="font-semibold flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Notificações de Tickets
          </h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              Marcar todas como lidas
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-96">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto mb-2 opacity-20" />
              <p>Nenhuma notificação</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-accent transition-colors cursor-pointer relative group ${
                    !notification.is_read ? 'bg-primary/5' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {!notification.is_read && (
                          <div className="w-2 h-2 rounded-full bg-primary" />
                        )}
                        <p className="font-medium text-sm">
                          {notification.ticket?.title || 'Ticket'}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(notification.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7"
                      onClick={(e) => handleDeleteNotification(notification.id, e)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
