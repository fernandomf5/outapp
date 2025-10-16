import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Search, Send, User, Clock, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Conversation {
  id: string;
  chatbot_id: string;
  session_id: string;
  visitor_name: string | null;
  visitor_email: string | null;
  visitor_phone: string | null;
  status: string;
  started_at: string;
  last_message_at: string;
  chatbot?: {
    name: string;
  };
}

interface Message {
  id: string;
  conversation_id: string;
  role: string;
  content: string;
  media_url: string | null;
  media_type: string | null;
  created_at: string;
}

export const ChatbotConversations = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Carregar conversas
  useEffect(() => {
    if (!user) return;

    const fetchConversations = async () => {
      const { data: chatbots } = await supabase
        .from('chatbots')
        .select('id')
        .eq('user_id', user.id);

      if (!chatbots || chatbots.length === 0) return;

      const chatbotIds = chatbots.map(c => c.id);

      const { data, error } = await supabase
        .from('chatbot_conversations')
        .select(`
          *,
          chatbots(name)
        `)
        .in('chatbot_id', chatbotIds)
        .order('last_message_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar conversas:', error);
        return;
      }

      setConversations(data || []);
    };

    fetchConversations();

    // Realtime subscription
    const channel = supabase
      .channel('chatbot-conversations')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chatbot_conversations'
      }, () => {
        fetchConversations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Carregar mensagens da conversa selecionada
  useEffect(() => {
    if (!selectedConversation) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('chatbot_messages')
        .select('*')
        .eq('conversation_id', selectedConversation.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Erro ao carregar mensagens:', error);
        return;
      }

      setMessages(data || []);
    };

    fetchMessages();

    // Realtime subscription para mensagens - recarrega TODAS as mensagens quando houver INSERT
    const channel = supabase
      .channel(`messages-${selectedConversation.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chatbot_messages',
        filter: `conversation_id=eq.${selectedConversation.id}`
      }, () => {
        // Recarregar todas as mensagens para garantir ordem correta
        fetchMessages();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('chatbot_messages')
        .insert({
          conversation_id: selectedConversation.id,
          role: 'admin',
          content: newMessage.trim()
        });

      if (error) throw error;

      setNewMessage("");
      
      toast({
        title: "Mensagem enviada! ✅",
        description: "Sua mensagem foi enviada com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao enviar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const searchLower = searchTerm.toLowerCase();
    return (
      conv.visitor_name?.toLowerCase().includes(searchLower) ||
      conv.visitor_email?.toLowerCase().includes(searchLower) ||
      conv.visitor_phone?.includes(searchTerm) ||
      conv.chatbot?.name?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-primary/10 p-3 rounded-xl">
          <MessageSquare className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Conversas de Clientes</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie todas as conversas dos seus chatbots
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de conversas */}
        <div className="lg:col-span-1 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar conversas..."
              className="pl-10"
            />
          </div>

          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-2">
              {filteredConversations.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">
                    {searchTerm ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}
                  </p>
                </div>
              ) : (
                filteredConversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                      selectedConversation?.id === conv.id
                        ? 'bg-primary/10 border-primary'
                        : 'bg-card border-border hover:bg-accent'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="bg-primary/20 p-2 rounded-full">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {conv.visitor_name || 'Visitante Anônimo'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {conv.chatbot?.name}
                          </p>
                        </div>
                      </div>
                      <Badge variant={conv.status === 'active' ? 'default' : 'secondary'}>
                        {conv.status === 'active' ? 'Ativo' : 'Encerrado'}
                      </Badge>
                    </div>
                    {conv.visitor_email && (
                      <p className="text-xs text-muted-foreground mb-1">
                        📧 {conv.visitor_email}
                      </p>
                    )}
                    {conv.visitor_phone && (
                      <p className="text-xs text-muted-foreground mb-1">
                        📱 {conv.visitor_phone}
                      </p>
                    )}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(conv.last_message_at), {
                        addSuffix: true,
                        locale: ptBR
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Chat */}
        <div className="lg:col-span-2">
          {selectedConversation ? (
            <div className="flex flex-col h-[680px] border rounded-lg bg-card">
              {/* Header do chat */}
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/20 p-2 rounded-full">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">
                      {selectedConversation.visitor_name || 'Visitante Anônimo'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedConversation.visitor_email || selectedConversation.visitor_phone || 'Sem contato'}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedConversation(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Mensagens */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === 'admin' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          msg.role === 'admin'
                            ? 'bg-primary text-primary-foreground'
                            : msg.role === 'bot'
                            ? 'bg-accent'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        {msg.media_url && (
                          <div className="mt-2">
                            {msg.media_type === 'image' && (
                              <img src={msg.media_url} alt="Imagem" className="rounded-md max-w-full" />
                            )}
                            {msg.media_type === 'video' && (
                              <video controls className="rounded-md max-w-full">
                                <source src={msg.media_url} />
                              </video>
                            )}
                            {msg.media_type === 'audio' && (
                              <audio controls className="w-full">
                                <source src={msg.media_url} />
                              </audio>
                            )}
                          </div>
                        )}
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(msg.created_at).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Input de mensagem */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    placeholder="Digite sua mensagem..."
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={isLoading || !newMessage.trim()}
                    className="bg-primary"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[680px] border rounded-lg bg-card">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-semibold mb-2">Selecione uma conversa</p>
                <p className="text-muted-foreground">
                  Escolha uma conversa para visualizar o histórico e responder
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
