import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Search, User, Send } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Conversation {
  id: string;
  status: string;
  created_at: string;
  last_message_at: string;
  agent_customers: {
    name: string;
    email: string;
  };
}

export default function AgentConversationsPanel({ agentId }: { agentId: string }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadConversations();
    setupRealtimeSubscription();
  }, [agentId]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = conversations.filter(conv =>
        conv.agent_customers.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.agent_customers.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredConversations(filtered);
    } else {
      setFilteredConversations(conversations);
    }
  }, [searchTerm, conversations]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  const loadConversations = async () => {
    const { data, error } = await supabase
      .from('agent_conversations')
      .select(`
        *,
        agent_customers (
          name,
          email
        )
      `)
      .eq('agent_id', agentId)
      .order('last_message_at', { ascending: false });

    if (error) {
      toast({
        title: "Erro ao carregar conversas",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setConversations(data || []);
      setFilteredConversations(data || []);
    }
    setLoading(false);
  };

  const loadMessages = async (conversationId: string) => {
    const { data } = await supabase
      .from('agent_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    setMessages(data || []);
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('agent-conversations-panel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agent_conversations',
          filter: `agent_id=eq.${agentId}`,
        },
        () => {
          loadConversations();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_messages',
        },
        (payload) => {
          if (selectedConversation && payload.new.conversation_id === selectedConversation.id) {
            setMessages(prev => [...prev, payload.new]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const { error } = await supabase
      .from('agent_messages')
      .insert({
        conversation_id: selectedConversation.id,
        role: 'agent',
        content: newMessage,
      });

    if (error) {
      toast({
        title: "Erro ao enviar mensagem",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setNewMessage("");
    }
  };

  const updateStatus = async (status: string) => {
    if (!selectedConversation) return;

    const { error } = await supabase
      .from('agent_conversations')
      .update({ status })
      .eq('id', selectedConversation.id);

    if (error) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Status atualizado!",
      });
      loadConversations();
      setSelectedConversation({ ...selectedConversation, status });
    }
  };

  if (loading) {
    return <div>Carregando conversas...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold">Conversas</h3>
        <Badge variant="outline">{conversations.length} total</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Lista de conversas */}
        <div className="md:col-span-1 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar conversas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <ScrollArea className="h-[600px]">
            <div className="space-y-2">
              {filteredConversations.map((conv) => (
                <Card
                  key={conv.id}
                  className={`cursor-pointer transition-all ${
                    selectedConversation?.id === conv.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedConversation(conv)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <div>
                          <div className="font-medium text-sm">{conv.agent_customers.name}</div>
                          <div className="text-xs text-muted-foreground">{conv.agent_customers.email}</div>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {conv.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      {format(new Date(conv.last_message_at), "dd/MM HH:mm", { locale: ptBR })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Área de mensagens */}
        <div className="md:col-span-2">
          {selectedConversation ? (
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{selectedConversation.agent_customers.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{selectedConversation.agent_customers.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={selectedConversation.status === 'active' ? 'default' : 'outline'}
                      onClick={() => updateStatus('active')}
                    >
                      Ativa
                    </Button>
                    <Button
                      size="sm"
                      variant={selectedConversation.status === 'closed' ? 'default' : 'outline'}
                      onClick={() => updateStatus('closed')}
                    >
                      Fechada
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === 'customer' ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          msg.role === 'customer'
                            ? 'bg-muted'
                            : 'bg-primary text-primary-foreground'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        <span className="text-xs opacity-70 mt-1 block">
                          {format(new Date(msg.created_at), "HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Digite sua mensagem..."
                  />
                  <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="h-[600px] flex items-center justify-center">
              <CardContent className="text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Selecione uma conversa para visualizar</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}