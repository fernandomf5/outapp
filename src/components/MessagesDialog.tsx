import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, Eye, EyeOff, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AdminMessage {
  id: string;
  title: string;
  message: string;
  content_html: string | null;
  image_url: string | null;
  created_at: string;
  is_read: boolean;
}

interface MessagesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MessagesDialog = ({ open, onOpenChange }: MessagesDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !open) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('admin_messages')
        .select('*')
        .or(`user_id.eq.${user.id},sent_to_all.eq.true`)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setMessages(data);
      }
      setLoading(false);
    };

    fetchMessages();

    // Real-time subscription - apenas para novas mensagens
    const channel = supabase
      .channel('messages_dialog_changes')
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

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, open]);

  const toggleReadStatus = async (messageId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    
    // Atualiza otimisticamente o estado local primeiro
    setMessages(messages.map(m => 
      m.id === messageId ? { ...m, is_read: newStatus } : m
    ));

    const { error } = await supabase
      .from('admin_messages')
      .update({ is_read: newStatus })
      .eq('id', messageId);

    if (error) {
      // Reverte se houver erro
      setMessages(messages.map(m => 
        m.id === messageId ? { ...m, is_read: currentStatus } : m
      ));
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: newStatus ? "Marcada como lida" : "Marcada como não lida",
      });
    }
  };

  const unreadMessages = messages.filter(m => !m.is_read);
  const readMessages = messages.filter(m => m.is_read);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] p-0">
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-6 h-6" />
              <DialogTitle>Minhas Mensagens</DialogTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="p-8 text-center">Carregando mensagens...</div>
        ) : messages.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Bell className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p>Você não tem mensagens ainda</p>
          </div>
        ) : (
          <Tabs defaultValue="unread" className="w-full">
            <TabsList className="w-full grid grid-cols-2 mx-6" style={{ width: 'calc(100% - 48px)' }}>
              <TabsTrigger value="unread">
                Não lidas ({unreadMessages.length})
              </TabsTrigger>
              <TabsTrigger value="all">
                Todas ({messages.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="unread" className="mt-0">
              <ScrollArea className="h-[500px] px-6 pb-6">
                {unreadMessages.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <p>Nenhuma mensagem não lida</p>
                  </div>
                ) : (
                  <div className="space-y-4 mt-4">
                    {unreadMessages.map((message) => (
                      <MessageCard
                        key={message.id}
                        message={message}
                        onToggleRead={toggleReadStatus}
                      />
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="all" className="mt-0">
              <ScrollArea className="h-[500px] px-6 pb-6">
                <div className="space-y-4 mt-4">
                  {messages.map((message) => (
                    <MessageCard
                      key={message.id}
                      message={message}
                      onToggleRead={toggleReadStatus}
                    />
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};

const MessageCard = ({ 
  message, 
  onToggleRead 
}: { 
  message: AdminMessage; 
  onToggleRead: (id: string, status: boolean) => void;
}) => (
  <Card className={`${!message.is_read ? "border-primary/50 bg-primary/5" : ""}`}>
    <CardContent className="p-6">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-lg">{message.title}</h3>
            {!message.is_read && (
              <Badge variant="default" className="text-xs">Nova</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {new Date(message.created_at).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onToggleRead(message.id, message.is_read)}
        >
          {message.is_read ? (
            <>
              <EyeOff className="w-4 h-4 mr-2" />
              Marcar não lida
            </>
          ) : (
            <>
              <Eye className="w-4 h-4 mr-2" />
              Marcar lida
            </>
          )}
        </Button>
      </div>

      {message.image_url && (
        <img 
          src={message.image_url} 
          alt="Imagem da mensagem" 
          className="w-full max-h-64 object-cover rounded-lg mb-4"
        />
      )}

      {message.content_html ? (
        <div 
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: message.content_html }}
        />
      ) : (
        <p className="text-muted-foreground whitespace-pre-wrap">
          {message.message}
        </p>
      )}
    </CardContent>
  </Card>
);
