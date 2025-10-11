import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface AdminMessage {
  id: string;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
}

export const NotificationBell = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('admin_messages')
        .select('*')
        .or(`user_id.eq.${user.id},sent_to_all.eq.true`)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setMessages(data);
        setUnreadCount(data.filter(m => !m.is_read).length);
      }
    };

    fetchMessages();

    // Real-time subscription
    const channel = supabase
      .channel('admin_messages_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'admin_messages'
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markAsRead = async (messageId: string) => {
    const { error } = await supabase
      .from('admin_messages')
      .update({ is_read: true })
      .eq('id', messageId);

    if (!error) {
      setMessages(messages.map(m => 
        m.id === messageId ? { ...m, is_read: true } : m
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    const unreadIds = messages.filter(m => !m.is_read).map(m => m.id);
    if (unreadIds.length === 0) return;

    const { error } = await supabase
      .from('admin_messages')
      .update({ is_read: true })
      .in('id', unreadIds);

    if (!error) {
      setMessages(messages.map(m => ({ ...m, is_read: true })));
      setUnreadCount(0);
      toast({
        title: "Notificações marcadas como lidas",
      });
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-destructive"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 sm:w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notificações</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs"
            >
              Marcar todas como lidas
            </Button>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {messages.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto mb-2 opacity-20" />
              <p>Nenhuma notificação</p>
            </div>
          ) : (
            <div className="divide-y">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`p-4 hover:bg-accent transition-colors cursor-pointer ${
                    !message.is_read ? "bg-primary/5" : ""
                  }`}
                  onClick={() => !message.is_read && markAsRead(message.id)}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="font-semibold text-sm">{message.title}</h4>
                    {!message.is_read && (
                      <span className="w-2 h-2 bg-primary rounded-full mt-1 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {message.message}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(message.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
