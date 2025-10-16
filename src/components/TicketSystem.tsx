import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, MessageSquare, Clock, CheckCircle2, AlertCircle, Send } from "lucide-react";

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string | null;
  created_at: string;
  updated_at: string;
}

interface TicketMessage {
  id: string;
  message: string;
  is_admin: boolean;
  created_at: string;
  user_id: string;
}

export const TicketSystem = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({
    title: "",
    description: "",
    category: "",
    priority: "medium"
  });

  useEffect(() => {
    if (user) {
      fetchTickets();
    }
  }, [user]);

  useEffect(() => {
    if (selectedTicket) {
      fetchMessages(selectedTicket.id);
      subscribeToMessages(selectedTicket.id);
    }
  }, [selectedTicket]);

  const fetchTickets = async () => {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setTickets(data);
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
      .channel(`ticket_messages:${ticketId}`)
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

  const handleCreateTicket = async () => {
    if (!newTicket.title || !newTicket.description) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    const { data, error } = await supabase
      .from('tickets')
      .insert({
        ...newTicket,
        user_id: user!.id
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Erro ao criar ticket",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Ticket criado!",
        description: "Responderemos em breve."
      });
      setTickets([data, ...tickets]);
      setNewTicket({ title: "", description: "", category: "", priority: "medium" });
      setIsCreateDialogOpen(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return;

    const { error } = await supabase
      .from('ticket_messages')
      .insert({
        ticket_id: selectedTicket.id,
        user_id: user!.id,
        message: newMessage,
        is_admin: false
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <Clock className="w-4 h-4" />;
      case 'in_progress': return <MessageSquare className="w-4 h-4" />;
      case 'resolved': return <CheckCircle2 className="w-4 h-4" />;
      case 'closed': return <CheckCircle2 className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Suporte</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary">
              <Plus className="w-4 h-4 mr-2" />
              Novo Ticket
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Ticket</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Título *</Label>
                <Input
                  value={newTicket.title}
                  onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                  placeholder="Descreva o problema resumidamente"
                />
              </div>
              <div>
                <Label>Descrição *</Label>
                <Textarea
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  placeholder="Detalhe o problema ou dúvida"
                  rows={4}
                />
              </div>
              <div>
                <Label>Categoria</Label>
                <Input
                  value={newTicket.category}
                  onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                  placeholder="Ex: Técnico, Financeiro, Geral"
                />
              </div>
              <div>
                <Label>Prioridade</Label>
                <Select value={newTicket.priority} onValueChange={(v) => setNewTicket({ ...newTicket, priority: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreateTicket} className="w-full gradient-primary">
                Criar Ticket
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Lista de Tickets */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Meus Tickets</h3>
          <div className="space-y-3">
            {tickets.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhum ticket criado ainda</p>
            ) : (
              tickets.map((ticket) => (
                <Card
                  key={ticket.id}
                  className={`p-4 transition-smooth hover:shadow-lg ${
                    selectedTicket?.id === ticket.id ? 'border-primary bg-primary/5' : ''
                  }`}
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold">{ticket.title}</h4>
                    <div className="flex gap-2">
                      <Badge className={getStatusColor(ticket.status)}>
                        {getStatusIcon(ticket.status)}
                      </Badge>
                      <Badge className={getPriorityColor(ticket.priority)}>
                        {ticket.priority}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{ticket.description}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(ticket.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </Card>
              ))
            )}
          </div>
        </Card>

        {/* Conversa do Ticket */}
        <Card className="p-6 flex flex-col h-[600px]">
          {selectedTicket ? (
            <>
              <div className="border-b pb-4 mb-4">
                <h3 className="font-semibold">{selectedTicket.title}</h3>
                <div className="flex gap-2 mt-2">
                  <Badge className={getStatusColor(selectedTicket.status)}>
                    {selectedTicket.status}
                  </Badge>
                  <Badge className={getPriorityColor(selectedTicket.priority)}>
                    {selectedTicket.priority}
                  </Badge>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.is_admin ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                        msg.is_admin
                          ? 'bg-card border border-border'
                          : 'bg-primary text-primary-foreground'
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
                  placeholder="Digite sua mensagem..."
                />
                <Button onClick={handleSendMessage} className="gradient-primary" size="icon">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Selecione um ticket para visualizar a conversa
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
