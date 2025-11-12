import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FileText, MessageSquare, Upload, AlertCircle, CheckCircle, Clock, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";

interface ClientPortalPanelProps {
  areaId: string;
}

export function ClientPortalPanel({ areaId }: ClientPortalPanelProps) {
  const [tickets, setTickets] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [ticketMessages, setTicketMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [areaId]);

  useEffect(() => {
    if (selectedTicket) {
      loadTicketMessages(selectedTicket.id);
    }
  }, [selectedTicket]);

  const loadData = async () => {
    try {
      // Carregar tickets
      const { data: ticketsData } = await supabase
        .from('members_support_tickets')
        .select('*')
        .eq('members_area_id', areaId)
        .order('created_at', { ascending: false });

      if (ticketsData) setTickets(ticketsData);

      // Carregar documentos
      const { data: docsData } = await supabase
        .from('members_client_documents')
        .select('*')
        .eq('members_area_id', areaId)
        .order('created_at', { ascending: false });

      if (docsData) setDocuments(docsData);
    } catch (error: any) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const loadTicketMessages = async (ticketId: string) => {
    try {
      const { data } = await supabase
        .from('members_ticket_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      setTicketMessages(data || []);
    } catch (error) {
      console.error('Erro ao carregar mensagens');
    }
  };

  const updateTicketStatus = async (ticketId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('members_support_tickets')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', ticketId);

      if (error) throw error;
      toast.success('Status atualizado');
      loadData();
    } catch (error) {
      toast.error('Erro ao atualizar status');
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('members_ticket_messages')
        .insert([{
          ticket_id: selectedTicket.id,
          sender_email: user.email,
          sender_name: 'Suporte',
          message: newMessage,
          is_staff: true
        }]);

      if (error) throw error;

      // Atualizar status do ticket para "in_progress" se estava "open"
      if (selectedTicket.status === 'open') {
        await updateTicketStatus(selectedTicket.id, 'in_progress');
      }

      setNewMessage("");
      loadTicketMessages(selectedTicket.id);
    } catch (error) {
      toast.error('Erro ao enviar mensagem');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertCircle className="w-4 h-4" />;
      case 'in_progress': return <Clock className="w-4 h-4" />;
      case 'resolved': return <CheckCircle className="w-4 h-4" />;
      case 'closed': return <CheckCircle className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'Aberto';
      case 'in_progress': return 'Em Andamento';
      case 'resolved': return 'Resolvido';
      case 'closed': return 'Fechado';
      default: return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <Tabs defaultValue="tickets" className="space-y-6">
      <TabsList>
        <TabsTrigger value="tickets">
          <MessageSquare className="w-4 h-4 mr-2" />
          Tickets de Suporte
        </TabsTrigger>
        <TabsTrigger value="documents">
          <FileText className="w-4 h-4 mr-2" />
          Documentos
        </TabsTrigger>
      </TabsList>

      <TabsContent value="tickets" className="space-y-4">
        {/* Estatísticas */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{tickets.filter(t => t.status === 'open').length}</div>
              <p className="text-sm text-muted-foreground">Abertos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{tickets.filter(t => t.status === 'in_progress').length}</div>
              <p className="text-sm text-muted-foreground">Em Andamento</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{tickets.filter(t => t.status === 'resolved').length}</div>
              <p className="text-sm text-muted-foreground">Resolvidos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{tickets.length}</div>
              <p className="text-sm text-muted-foreground">Total</p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Tickets */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Lista de Tickets</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedTicket?.id === ticket.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="font-medium">{ticket.subject}</div>
                      <div className="text-sm text-muted-foreground">{ticket.user_name}</div>
                      <div className="text-xs text-muted-foreground">{ticket.user_email}</div>
                    </div>
                    <Badge variant={getPriorityColor(ticket.priority)}>
                      {ticket.priority}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="gap-1">
                      {getStatusIcon(ticket.status)}
                      {getStatusLabel(ticket.status)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(ticket.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              ))}

              {tickets.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum ticket aberto
                </div>
              )}
            </CardContent>
          </Card>

          {/* Detalhes do Ticket */}
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedTicket ? 'Detalhes do Ticket' : 'Selecione um Ticket'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedTicket ? (
                <div className="space-y-4">
                  <div>
                    <Label>Status</Label>
                    <Select
                      value={selectedTicket.status}
                      onValueChange={(value) => updateTicketStatus(selectedTicket.id, value)}
                    >
                      <SelectTrigger>
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

                  <div className="border rounded-lg p-4 bg-muted/30">
                    <div className="font-medium mb-2">Descrição:</div>
                    <div className="text-sm whitespace-pre-wrap">{selectedTicket.description}</div>
                  </div>

                  {/* Mensagens */}
                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {ticketMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-3 rounded-lg ${
                          msg.is_staff ? 'bg-primary/10 ml-4' : 'bg-muted mr-4'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="font-medium text-sm">{msg.sender_name}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(msg.created_at).toLocaleString('pt-BR')}
                          </div>
                        </div>
                        <div className="text-sm">{msg.message}</div>
                      </div>
                    ))}
                  </div>

                  {/* Nova Mensagem */}
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Digite sua resposta..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      rows={3}
                    />
                    <Button onClick={sendMessage} className="w-full">
                      Enviar Resposta
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  Selecione um ticket para ver os detalhes
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="documents" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Documentos do Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between border rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-primary" />
                    <div>
                      <div className="font-medium">{doc.title}</div>
                      <div className="text-sm text-muted-foreground">{doc.description}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Cliente: {doc.user_email}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </a>
                    </Button>
                  </div>
                </div>
              ))}

              {documents.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  Nenhum documento disponível
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}