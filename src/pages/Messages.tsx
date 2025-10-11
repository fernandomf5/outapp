import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AdminMessage {
  id: string;
  title: string;
  message: string;
  content_html: string | null;
  image_url: string | null;
  created_at: string;
  is_read: boolean;
}

export default function Messages() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [loading, setLoading] = useState(true);

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
      }
      setLoading(false);
    };

    fetchMessages();

    // Real-time subscription
    const channel = supabase
      .channel('messages_page_changes')
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

  const toggleReadStatus = async (messageId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('admin_messages')
      .update({ is_read: !currentStatus })
      .eq('id', messageId);

    if (!error) {
      setMessages(messages.map(m => 
        m.id === messageId ? { ...m, is_read: !currentStatus } : m
      ));
      toast({
        title: !currentStatus ? "Marcada como lida" : "Marcada como não lida",
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            Carregando mensagens...
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6" />
            <CardTitle>Minhas Mensagens</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {messages.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p>Você não tem mensagens ainda</p>
            </div>
          ) : (
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <Card 
                    key={message.id}
                    className={`${!message.is_read ? "border-primary/50 bg-primary/5" : ""}`}
                  >
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
                          onClick={() => toggleReadStatus(message.id, message.is_read)}
                        >
                          {message.is_read ? (
                            <>
                              <EyeOff className="w-4 h-4 mr-2" />
                              Marcar como não lida
                            </>
                          ) : (
                            <>
                              <Eye className="w-4 h-4 mr-2" />
                              Marcar como lida
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
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}