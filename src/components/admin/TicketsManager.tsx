import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, Clock, CheckCircle2, Send, Filter } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "react-router-dom";

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string | null;
  created_at: string;
  user_id: string;
  user_email?: string;
  user_name?: string;
  user_profile_name?: string;
  unread_count?: number;
}

interface TicketMessage {
  id: string;
  message: string;
  is_admin: boolean;
  created_at: string;
  user_id: string;
  attachments?: { url: string; name: string }[];
  agent_name?: string;
}

export const TicketsManager = () => {
  const { toast } = useToast();
  const location = useLocation();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [agentName, setAgentName] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [displayCount, setDisplayCount] = useState(5);

  useEffect(() => {
    fetchTickets();
  }, [statusFilter]);

  useEffect(() => {
    if (selectedTicket) {
      fetchMessages(selectedTicket.id);
      const cleanup = subscribeToMessages(selectedTicket.id);
      return cleanup;
    }
  }, [selectedTicket]);

  // Subscrever a todas as mensagens de tickets para atualizar contador
  useEffect(() => {
    const channel = supabase
      .channel('all_ticket_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ticket_messages',
        },
        () => {
          fetchTickets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [statusFilter]);

  // Auto-selecionar ticket da URL (reage a mudanças na URL)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const ticketId = params.get('ticketId');
    if (ticketId && tickets.length > 0) {
      const ticket = tickets.find(t => t.id === ticketId);
      if (ticket) {
        setSelectedTicket(ticket);
      }
    }
  }, [tickets, location.search]);

  const fetchTickets = async () => {
    let query = supabase
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data: ticketsData, error } = await query;

    if (!error && ticketsData) {
      // Buscar perfis dos usuários
      const userIds = [...new Set(ticketsData.map(t => t.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, email, full_name')
        .in('user_id', userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);
      
      // Buscar contagem de mensagens não lidas por ticket
      const ticketIds = ticketsData.map(t => t.id);
      const { data: messagesData } = await supabase
        .from('ticket_messages')
        .select('ticket_id')
        .in('ticket_id', ticketIds)
        .eq('is_admin', false)
        .gt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      const unreadCountMap = new Map<string, number>();
      messagesData?.forEach(msg => {
        const count = unreadCountMap.get(msg.ticket_id) || 0;
        unreadCountMap.set(msg.ticket_id, count + 1);
      });
      
      const enrichedTickets = ticketsData.map(ticket => ({
        ...ticket,
        user_email: profilesMap.get(ticket.user_id)?.email,
        user_profile_name: profilesMap.get(ticket.user_id)?.full_name,
        unread_count: unreadCountMap.get(ticket.id) || 0
      }));

      setTickets(enrichedTickets);
    }
  };

  const fetchMessages = async (ticketId: string) => {
    const { data, error } = await supabase
      .from('ticket_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setMessages(data as unknown as TicketMessage[]);
    }
  };

  const subscribeToMessages = (ticketId: string) => {
    const channel = supabase
      .channel(`admin_ticket_messages:${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ticket_messages',
          filter: `ticket_id=eq.${ticketId}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as TicketMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket || !agentName.trim()) {
      toast({
        title: "Erro",
        description: "Preencha o nome do atendente e a mensagem",
        variant: "destructive"
      });
      return;
    }

    const { error } = await supabase
      .from('ticket_messages')
      .insert({
        ticket_id: selectedTicket.id,
        user_id: selectedTicket.user_id,
        message: newMessage,
        is_admin: true,
        agent_name: agentName
      });

    if (error) {
      toast({
        title: "Erro ao enviar",
        description: error.message,
        variant: "destructive"
      });
    } else {
      setNewMessage("");
    }
  };

  const markTicketNotificationsAsRead = async (ticketId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('ticket_notifications')
      .update({ is_read: true })
      .eq('ticket_id', ticketId)
      .eq('user_id', user.id)
      .eq('is_read', false);
  };

  useEffect(() => {
    if (selectedTicket) {
      markTicketNotificationsAsRead(selectedTicket.id);
    }
  }, [selectedTicket]);

  const handleTicketClick = async (ticket: Ticket) => {
    setSelectedTicket(ticket);
    await markTicketNotificationsAsRead(ticket.id);
    fetchTickets(); // Atualiza contadores
  };

  const handleUpdateStatus = async (ticketId: string, newStatus: string) => {
    const { error } = await supabase
      .from('tickets')
      .update({ 
        status: newStatus,
        resolved_at: newStatus === 'resolved' ? new Date().toISOString() : null
      })
      .eq('id', ticketId);

    if (!error) {
      fetchTickets();
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status: newStatus });
      }
      toast({
        title: "Status atualizado"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-500/20 text-blue-500';
      case 'in_progress': return 'bg-yellow-500/20 text-yellow-500';
      case 'resolved': return 'bg-green-500/20 text-green-500';
      case 'closed': return 'bg-gray-500/20 text-gray-500';
      default: return 'bg-gray-500/20 text-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-500/20 text-green-500';
      case 'medium': return 'bg-yellow-500/20 text-yellow-500';
      case 'high': return 'bg-orange-500/20 text-orange-500';
      case 'urgent': return 'bg-red-500/20 text-red-500';
      default: return 'bg-gray-500/20 text-gray-500';
    }
  };

  const visibleTickets = tickets.slice(0, displayCount);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-primary" />
          Gerenciar Tickets
        </h2>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="open">Abertos</SelectItem>
              <SelectItem value="in_progress">Em Andamento</SelectItem>
              <SelectItem value="resolved">Resolvidos</SelectItem>
              <SelectItem value="closed">Fechados</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Lista de Tickets */}
        <div className="space-y-4">
          <h3 className="font-semibold">Tickets ({tickets.length})</h3>
          {visibleTickets.map((ticket) => (
            <Card
              key={ticket.id}
              className={`p-4 transition-smooth hover:shadow-lg relative ${
                selectedTicket?.id === ticket.id ? 'border-primary bg-primary/5' : ''
              }`}
              onClick={() => handleTicketClick(ticket)}
            >
              {ticket.unread_count && ticket.unread_count > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-red-500 text-white">
                  {ticket.unread_count} nova{ticket.unread_count > 1 ? 's' : ''}
                </Badge>
              )}
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold">{ticket.title}</h4>
                  <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                    {ticket.user_name && (
                      <p>Nome: <span className="font-medium">{ticket.user_name}</span></p>
                    )}
                    <p>Email: <span className="font-medium">{ticket.user_email || 'Não informado'}</span></p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge className={getStatusColor(ticket.status)}>
                    {ticket.status}
                  </Badge>
                  <Badge className={getPriorityColor(ticket.priority)}>
                    {ticket.priority}
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">{ticket.description}</p>
              <p className="text-xs text-muted-foreground mt-2">
                {new Date(ticket.created_at).toLocaleDateString('pt-BR')} às{' '}
                {new Date(ticket.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </Card>
          ))}
          {tickets.length > displayCount && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setDisplayCount(prev => prev + 5)}
            >
              Carregar mais tickets
            </Button>
          )}
        </div>

        {/* Conversa e Ações */}
        <Card className="p-6 flex flex-col h-[700px]">
          {selectedTicket ? (
            <>
              <div className="border-b pb-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold">{selectedTicket.title}</h3>
                    <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                      {selectedTicket.user_name && (
                        <p>Nome: <span className="font-medium">{selectedTicket.user_name}</span></p>
                      )}
                      <p>Email: <span className="font-medium">{selectedTicket.user_email || 'Não informado'}</span></p>
                    </div>
                  </div>
                  <Select
                    value={selectedTicket.status}
                    onValueChange={(v) => handleUpdateStatus(selectedTicket.id, v)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Aberto</SelectItem>
                      <SelectItem value="in_progress">Em Andamento</SelectItem>
                      <SelectItem value="resolved">Resolvido</SelectItem>
                      <SelectItem value="closed">Fechado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{selectedTicket.description}</p>
                <div className="flex gap-2">
                  <Badge className={getPriorityColor(selectedTicket.priority)}>
                    {selectedTicket.priority}
                  </Badge>
                  {selectedTicket.category && (
                    <Badge variant="outline">{selectedTicket.category}</Badge>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.is_admin ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2 shadow-sm ${
                        msg.is_admin
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground'
                      }`}
                    >
                      <p className="text-xs font-semibold mb-1 opacity-80">
                        {msg.is_admin ? (msg.agent_name || 'Atendente') : (selectedTicket?.user_name || 'Usuário')}
                      </p>
                      <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {msg.attachments.map((att, idx) => (
                            <a
                              key={idx}
                              href={att.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block"
                            >
                              <img src={att.url} alt={att.name} className="max-w-full rounded border" />
                            </a>
                          ))}
                        </div>
                      )}
                      <span className="text-xs opacity-70 mt-1 block">
                        {new Date(msg.created_at).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Input
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  placeholder="Seu nome (atendente)"
                  className="mb-2"
                />
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Responder ao ticket..."
                  />
                  <Button onClick={handleSendMessage} className="gradient-primary" size="icon">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Selecione um ticket para visualizar e responder
            </div>
          )}
        </Card>
      </div>
    </Card>
  );
};
