import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { MessagesDialog } from "@/components/MessagesDialog";

interface AdminMessage {
  id: string;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
}

export const NotificationBell = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);

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
      setUnreadCount(messagesWithReadStatus.filter(m => !m.is_read).length);
    };

    fetchMessages();

    // Real-time subscription - ouvir novas mensagens
    const messagesChannel = supabase
      .channel('admin_messages_bell')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'admin_messages'
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    // Real-time subscription - ouvir mudanças no status de leitura
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
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(readsChannel);
    };
  }, [user]);


  return (
    <>
      <Button 
        variant="ghost" 
        size="icon" 
        className="relative"
        onClick={() => setDialogOpen(true)}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-destructive"
          >
            {unreadCount}
          </Badge>
        )}
      </Button>

      <MessagesDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
};
