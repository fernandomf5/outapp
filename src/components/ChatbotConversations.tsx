import { useEffect, useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Search, Send, User, Clock, X, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  const [isVisitorTyping, setIsVisitorTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

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

  // Auto-scroll quando mensagens mudam
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
    const messagesChannel = supabase
      .channel(`messages-${selectedConversation.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chatbot_messages',
        filter: `conversation_id=eq.${selectedConversation.id}`
      }, () => {
        console.log('📨 Nova mensagem recebida - recarregando...');
        fetchMessages();
      })
      .subscribe();

    // Canal para receber status de typing
    const typingChannel = supabase
      .channel(`typing-${selectedConversation.id}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        console.log('⌨️ Status de typing recebido:', payload);
        if (payload.payload.conversationId === selectedConversation.id) {
          setIsVisitorTyping(payload.payload.isTyping);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(typingChannel);
      setIsVisitorTyping(false);
    };
  }, [selectedConversation]);

  const handleAdminTyping = (value: string) => {
    setNewMessage(value);
    
    if (!selectedConversation) return;
    
    // Enviar status de "digitando" para o cliente
    const channel = supabase.channel(`admin-typing-${selectedConversation.id}`);
    channel.send({
      type: 'broadcast',
      event: 'admin-typing',
      payload: { isTyping: value.length > 0, conversationId: selectedConversation.id }
    });

    // Limpar timeout anterior
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Enviar "parou de digitar" após 2 segundos
    typingTimeoutRef.current = setTimeout(() => {
      channel.send({
        type: 'broadcast',
        event: 'admin-typing',
        payload: { isTyping: false, conversationId: selectedConversation.id }
      });
    }, 2000);
  };

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

  const handleChangeStatus = async (conversationId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('chatbot_conversations')
        .update({ status: newStatus })
        .eq('id', conversationId);

      if (error) throw error;

      toast({
        title: "Status atualizado! ✅",
        description: `Status alterado para: ${newStatus === 'active' ? 'Ativo' : 'Encerrado'}`,
      });

      // Atualizar a conversa selecionada se for a mesma
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation({ ...selectedConversation, status: newStatus });
      }
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteConversation = async () => {
    if (!conversationToDelete) return;

    try {
      // Primeiro deletar mensagens
      await supabase
        .from('chatbot_messages')
        .delete()
        .eq('conversation_id', conversationToDelete);

      // Depois deletar conversa
      const { error } = await supabase
        .from('chatbot_conversations')
        .delete()
        .eq('id', conversationToDelete);

      if (error) throw error;

      toast({
        title: "Conversa excluída! ✅",
        description: "A conversa foi removida com sucesso.",
      });

      // Se era a conversa selecionada, limpar seleção
      if (selectedConversation?.id === conversationToDelete) {
        setSelectedConversation(null);
        setMessages([]);
      }

      setShowDeleteDialog(false);
      setConversationToDelete(null);
    } catch (error: any) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
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
                    {isVisitorTyping ? (
                      <p className="text-xs text-primary animate-pulse">
                        Digitando...
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        {selectedConversation.visitor_email || selectedConversation.visitor_phone || 'Sem contato'}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        Ações
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleChangeStatus(selectedConversation.id, 
                          selectedConversation.status === 'active' ? 'closed' : 'active'
                        )}
                      >
                        {selectedConversation.status === 'active' ? (
                          <>
                            <XCircle className="w-4 h-4 mr-2" />
                            Encerrar conversa
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Reabrir conversa
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => {
                          setConversationToDelete(selectedConversation.id);
                          setShowDeleteDialog(true);
                        }}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir conversa
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedConversation(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
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
                            ? 'bg-secondary/50'
                            : 'bg-muted'
                        }`}
                      >
                        {msg.role !== 'admin' && msg.role !== 'user' && (
                          <p className="text-xs text-muted-foreground mb-1">🤖 Bot</p>
                        )}
                        {msg.role === 'user' && (
                          <p className="text-xs text-muted-foreground mb-1">👤 Cliente</p>
                        )}
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
                  {isVisitorTyping && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-lg p-3 flex items-center gap-1">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input de mensagem */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => handleAdminTyping(e.target.value)}
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

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conversa?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Todas as mensagens desta conversa serão
              permanentemente excluídas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConversation}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
