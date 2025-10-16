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
}

interface TicketMessage {
  id: string;
  message: string;
  is_admin: boolean;
  created_at: string;
  user_id: string;
}

export const TicketsManager = () => {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [displayCount, setDisplayCount] = useState(5);

  useEffect(() => {
    fetchTickets();
  }, [statusFilter]);

  useEffect(() => {
    if (selectedTicket) {
      fetchMessages(selectedTicket.id);
      subscribeToMessages(selectedTicket.id);
    }
  }, [selectedTicket]);

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
      
      const enrichedTickets = ticketsData.map(ticket => ({
        ...ticket,
        user_email: profilesMap.get(ticket.user_id)?.email,
        user_name: profilesMap.get(ticket.user_id)?.full_name
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
      setMessages(data);
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
    if (!newMessage.trim() || !selectedTicket) return;

    const { error } = await supabase
      .from('ticket_messages')
      .insert({
        ticket_id: selectedTicket.id,
        user_id: selectedTicket.user_id,
        message: newMessage,
        is_admin: true
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
              className={`p-4 transition-smooth hover:shadow-lg ${
                selectedTicket?.id === ticket.id ? 'border-primary bg-primary/5' : ''
              }`}
              onClick={() => setSelectedTicket(ticket)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold">{ticket.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    De: {ticket.user_name || ticket.user_email || `Usuário ${ticket.user_id.slice(0, 8)}...`}
                  </p>
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
                  <h3 className="font-semibold">{selectedTicket.title}</h3>
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
                      className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                        msg.is_admin
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-card border border-border'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
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
