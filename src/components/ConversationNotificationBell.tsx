import { useState, useEffect } from "react";
import { MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ConversationNotification {
  id: string;
  type: 'agent' | 'chatbot';
  agent_id?: string;
  chatbot_id?: string;
  agent_name?: string;
  chatbot_name?: string;
  customer_name: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

export const ConversationNotificationBell = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<ConversationNotification[]>([]);
  const [totalUnread, setTotalUnread] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchNotifications();

    // Real-time subscriptions for agent conversations
    const agentConvChannel = supabase
      .channel('agent-conv-notif')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agent_conversations',
        },
        () => fetchNotifications()
      )
      .subscribe();

    // Real-time subscriptions for agent messages
    const agentMsgChannel = supabase
      .channel('agent-msg-notif')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_messages',
        },
        () => fetchNotifications()
      )
      .subscribe();

    // Real-time subscriptions for chatbot conversations
    const chatbotConvChannel = supabase
      .channel('chatbot-conv-notif')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chatbot_conversations',
        },
        () => fetchNotifications()
      )
      .subscribe();

    // Real-time subscriptions for chatbot messages
    const chatbotMsgChannel = supabase
      .channel('chatbot-msg-notif')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chatbot_messages',
        },
        () => fetchNotifications()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(agentConvChannel);
      supabase.removeChannel(agentMsgChannel);
      supabase.removeChannel(chatbotConvChannel);
      supabase.removeChannel(chatbotMsgChannel);
    };
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;

    const notifications: ConversationNotification[] = [];
    let totalUnreadCount = 0;

    // Fetch agent conversations with unread messages
    const { data: agents } = await supabase
      .from('ai_agents')
      .select('id, name')
      .eq('user_id', user.id);

    if (agents) {
      for (const agent of agents) {
        const { data: conversations } = await supabase
          .from('agent_conversations')
          .select(`
            id,
            last_message_at,
            agent_customers (name)
          `)
          .eq('agent_id', agent.id)
          .eq('status', 'active')
          .order('last_message_at', { ascending: false });

        if (conversations) {
          for (const conv of conversations) {
            // Get last message
            const { data: messages } = await supabase
              .from('agent_messages')
              .select('content, role, created_at')
              .eq('conversation_id', conv.id)
              .order('created_at', { ascending: false })
              .limit(20);

            // Count unread messages (customer messages after last agent message)
            let unreadCount = 0;
            if (messages && messages.length > 0) {
              // Find the index of the last agent message
              const lastAgentIndex = messages.findIndex(m => m.role === 'agent');
              
              if (lastAgentIndex === -1) {
                // No agent message yet, count all customer messages
                unreadCount = messages.filter(m => m.role === 'customer').length;
              } else {
                // Count customer messages that came after the last agent message (before it in the array since it's DESC)
                unreadCount = messages.slice(0, lastAgentIndex).filter(m => m.role === 'customer').length;
              }
            }
            
            if (unreadCount > 0) {
              notifications.push({
                id: conv.id,
                type: 'agent',
                agent_id: agent.id,
                agent_name: agent.name,
                customer_name: (conv.agent_customers as any)?.name || 'Cliente',
                last_message: messages?.[0]?.content || '',
                last_message_at: conv.last_message_at,
                unread_count: unreadCount,
              });
              totalUnreadCount += unreadCount;
            }
          }
        }
      }
    }

    // Fetch chatbot conversations with unread messages
    const { data: chatbots } = await supabase
      .from('chatbots')
      .select('id, name')
      .eq('user_id', user.id);

    if (chatbots) {
      for (const chatbot of chatbots) {
        const { data: conversations } = await supabase
          .from('chatbot_conversations')
          .select('id, visitor_name, last_message_at')
          .eq('chatbot_id', chatbot.id)
          .eq('status', 'active')
          .order('last_message_at', { ascending: false });

        if (conversations) {
          for (const conv of conversations) {
            // Get last message
            const { data: messages } = await supabase
              .from('chatbot_messages')
              .select('content, role, created_at')
              .eq('conversation_id', conv.id)
              .order('created_at', { ascending: false })
              .limit(20);

            // Count unread messages (user messages after last admin/bot message)
            let unreadCount = 0;
            if (messages && messages.length > 0) {
              // Find the index of the last admin or bot message
              const lastResponseIndex = messages.findIndex(m => m.role === 'admin' || m.role === 'bot' || m.role === 'assistant');
              
              if (lastResponseIndex === -1) {
                // No admin/bot message yet, count all user messages
                unreadCount = messages.filter(m => m.role === 'user').length;
              } else {
                // Count user messages that came after the last admin/bot message (before it in the array since it's DESC)
                unreadCount = messages.slice(0, lastResponseIndex).filter(m => m.role === 'user').length;
              }
            }
            
            if (unreadCount > 0) {
              notifications.push({
                id: conv.id,
                type: 'chatbot',
                chatbot_id: chatbot.id,
                chatbot_name: chatbot.name,
                customer_name: conv.visitor_name || 'Visitante',
                last_message: messages?.[0]?.content || '',
                last_message_at: conv.last_message_at,
                unread_count: unreadCount,
              });
              totalUnreadCount += unreadCount;
            }
          }
        }
      }
    }

    // Sort by last message time
    notifications.sort((a, b) => 
      new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
    );

    setNotifications(notifications);
    setTotalUnread(totalUnreadCount);
  };

  const handleNotificationClick = (notification: ConversationNotification) => {
    setIsOpen(false);
    
    if (notification.type === 'agent') {
      navigate(`/dashboard?tab=agents&agentId=${notification.agent_id}&view=manage`);
    } else {
      navigate(`/dashboard?tab=chatbots&chatbotId=${notification.chatbot_id}&view=manage`);
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
          <MessageCircle className="w-5 h-5" />
          {totalUnread > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-destructive"
            >
              {totalUnread > 9 ? '9+' : totalUnread}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="font-semibold flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Conversas
          </h3>
        </div>
        
        <ScrollArea className="h-96">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-20" />
              <p>Nenhuma conversa nova</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="p-4 hover:bg-accent transition-colors cursor-pointer bg-primary/5"
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <p className="font-medium text-sm">
                          {notification.type === 'agent' ? notification.agent_name : notification.chatbot_name}
                        </p>
                        <Badge variant="secondary" className="text-xs">
                          {notification.unread_count}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {notification.customer_name}
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {notification.last_message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(notification.last_message_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
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
