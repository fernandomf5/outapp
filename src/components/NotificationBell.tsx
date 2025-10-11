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
