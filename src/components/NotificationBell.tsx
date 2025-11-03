import { useState, useEffect } from "react";
import { Bell, MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { MessagesDialog } from "@/components/MessagesDialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface AdminMessage {
  id: string;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
}

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

export const NotificationBell = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [conversations, setConversations] = useState<ConversationNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchMessages = async () => {
      // Buscar mensagens do usuário ou broadcast
      const { data: messagesData, error: messagesError } = await supabase
        .from('admin_messages')
        .select('*')
        .or(`user_id.eq.${user.id},sent_to_all.eq.true`)
        .order('created_at', { ascending: false });

      if (messagesError || !messagesData) return;

      // Buscar status de leitura do usuário
      const { data: readsData } = await supabase
        .from('admin_message_reads')
        .select('message_id, is_read')
        .eq('user_id', user.id);

      // Mapear status de leitura
      const readStatusMap = new Map(
        readsData?.map(r => [r.message_id, r.is_read]) || []
      );

      // Combinar mensagens com status de leitura
      const messagesWithReadStatus = messagesData.map(msg => ({
        ...msg,
        is_read: readStatusMap.get(msg.id) || false
      }));

      setMessages(messagesWithReadStatus);
    };

    const fetchConversations = async () => {
      const conversationsList: ConversationNotification[] = [];

      // Fetch agent conversations
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
              const { data: messages } = await supabase
                .from('agent_messages')
                .select('content, role, created_at')
                .eq('conversation_id', conv.id)
                .order('created_at', { ascending: false })
                .limit(20);

              let unreadCount = 0;
              if (messages && messages.length > 0) {
                const lastAgentIndex = messages.findIndex(m => m.role === 'agent');
                
                if (lastAgentIndex === -1) {
                  unreadCount = messages.filter(m => m.role === 'customer').length;
                } else {
                  unreadCount = messages.slice(0, lastAgentIndex).filter(m => m.role === 'customer').length;
                }
              }
              
              if (unreadCount > 0) {
                conversationsList.push({
                  id: conv.id,
                  type: 'agent',
                  agent_id: agent.id,
                  agent_name: agent.name,
                  customer_name: (conv.agent_customers as any)?.name || 'Cliente',
                  last_message: messages?.[0]?.content || '',
                  last_message_at: conv.last_message_at,
                  unread_count: unreadCount,
                });
              }
            }
          }
        }
      }

      // Fetch chatbot conversations
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
              const { data: messages } = await supabase
                .from('chatbot_messages')
                .select('content, role, created_at')
                .eq('conversation_id', conv.id)
                .order('created_at', { ascending: false })
                .limit(20);

              let unreadCount = 0;
              if (messages && messages.length > 0) {
                const lastResponseIndex = messages.findIndex(m => m.role === 'admin' || m.role === 'bot' || m.role === 'assistant');
                
                if (lastResponseIndex === -1) {
                  unreadCount = messages.filter(m => m.role === 'user').length;
                } else {
                  unreadCount = messages.slice(0, lastResponseIndex).filter(m => m.role === 'user').length;
                }
              }
              
              if (unreadCount > 0) {
                conversationsList.push({
                  id: conv.id,
                  type: 'chatbot',
                  chatbot_id: chatbot.id,
                  chatbot_name: chatbot.name,
                  customer_name: conv.visitor_name || 'Visitante',
                  last_message: messages?.[0]?.content || '',
                  last_message_at: conv.last_message_at,
                  unread_count: unreadCount,
                });
              }
            }
          }
        }
      }

      conversationsList.sort((a, b) => 
        new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
      );

      setConversations(conversationsList);
    };

    const updateCounts = async () => {
      await fetchMessages();
      await fetchConversations();
      
      const adminUnread = messages.filter(m => !m.is_read).length;
      const conversationUnread = conversations.reduce((sum, c) => sum + c.unread_count, 0);
      setUnreadCount(adminUnread + conversationUnread);
    };

    updateCounts();

    // Real-time subscriptions
    const messagesChannel = supabase
      .channel('admin_messages_bell')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'admin_messages'
        },
        updateCounts
      )
      .subscribe();

    const readsChannel = supabase
      .channel('message_reads_bell')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'admin_message_reads',
          filter: `user_id=eq.${user.id}`
        },
        updateCounts
      )
      .subscribe();

    const agentConvChannel = supabase
      .channel('agent-conv-bell')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agent_conversations',
        },
        updateCounts
      )
      .subscribe();

    const agentMsgChannel = supabase
      .channel('agent-msg-bell')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_messages',
        },
        updateCounts
      )
      .subscribe();

    const chatbotConvChannel = supabase
      .channel('chatbot-conv-bell')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chatbot_conversations',
        },
        updateCounts
      )
      .subscribe();

    const chatbotMsgChannel = supabase
      .channel('chatbot-msg-bell')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chatbot_messages',
        },
        updateCounts
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(readsChannel);
      supabase.removeChannel(agentConvChannel);
      supabase.removeChannel(agentMsgChannel);
      supabase.removeChannel(chatbotConvChannel);
      supabase.removeChannel(chatbotMsgChannel);
    };
  }, [user, messages, conversations]);


  const handleConversationClick = (notification: ConversationNotification) => {
    setIsOpen(false);
    
    if (notification.type === 'agent') {
      navigate(`/dashboard?tab=agents&agentId=${notification.agent_id}&view=manage&conversationId=${notification.id}`);
    } else {
      navigate(`/dashboard?tab=chatbots&chatbotId=${notification.chatbot_id}&view=manage&conversationId=${notification.id}`);
    }
  };

  const totalConversationUnread = conversations.reduce((sum, c) => sum + c.unread_count, 0);
  const totalAdminUnread = messages.filter(m => !m.is_read).length;
  const totalUnreadCount = totalConversationUnread + totalAdminUnread;

  return (
    <>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative"
          >
            <Bell className="w-5 h-5" />
            {totalUnreadCount > 0 && (
              <Badge 
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-destructive"
              >
                {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96 p-0" align="end">
          <div className="flex items-center justify-between border-b p-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notificações
            </h3>
            {(totalAdminUnread > 0 || totalConversationUnread > 0) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDialogOpen(true)}
              >
                Ver mensagens
              </Button>
            )}
          </div>
          
          <ScrollArea className="h-96">
            {conversations.length === 0 && messages.filter(m => !m.is_read).length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Bell className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p>Nenhuma notificação nova</p>
              </div>
            ) : (
              <div className="divide-y">
                {conversations.map((notification) => (
                  <div
                    key={notification.id}
                    className="p-4 hover:bg-accent transition-colors cursor-pointer bg-primary/5"
                    onClick={() => handleConversationClick(notification)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <MessageCircle className="w-4 h-4 text-primary" />
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
                
                {messages.filter(m => !m.is_read).map((msg) => (
                  <div
                    key={msg.id}
                    className="p-4 hover:bg-accent transition-colors cursor-pointer bg-primary/5"
                    onClick={() => setDialogOpen(true)}
                  >
                    <div className="flex items-start gap-2">
                      <Bell className="w-4 h-4 text-primary mt-1" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{msg.title}</p>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {msg.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(msg.created_at).toLocaleString('pt-BR')}
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

      <MessagesDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
};
