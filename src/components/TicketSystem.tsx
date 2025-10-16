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
import { Plus, MessageSquare, Clock, CheckCircle2, AlertCircle, Send, Image as ImageIcon, Paperclip, Edit, Trash2 } from "lucide-react";

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
  attachments?: { url: string; name: string }[];
}

export const TicketSystem = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useState(() => new URLSearchParams(window.location.search));
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
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [messageAttachments, setMessageAttachments] = useState<{ url: string; name: string }[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);

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

  // Auto-selecionar ticket da URL
  useEffect(() => {
    const ticketId = searchParams.get('ticketId');
    if (ticketId && tickets.length > 0 && !selectedTicket) {
      const ticket = tickets.find(t => t.id === ticketId);
      if (ticket) {
        setSelectedTicket(ticket);
      }
    }
  }, [tickets, searchParams]);

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
      setMessages(data as unknown as TicketMessage[]);
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const uploadedUrls: string[] = [];

    for (const file of Array.from(files)) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user!.id}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('chatbot-media')
        .upload(fileName, file);

      if (error) {
        toast({
          title: "Erro ao fazer upload",
          description: error.message,
          variant: "destructive"
        });
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from('chatbot-media')
          .getPublicUrl(fileName);
        uploadedUrls.push(publicUrl);
      }
    }

    setUploadedImages([...uploadedImages, ...uploadedUrls]);
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
      // Se houver imagens, criar mensagem inicial com anexos
      if (uploadedImages.length > 0) {
        await supabase
          .from('ticket_messages')
          .insert({
            ticket_id: data.id,
            user_id: user!.id,
            message: "Anexos iniciais do ticket",
            is_admin: false,
            attachments: uploadedImages.map(url => ({ url, name: 'Imagem' }))
          });
      }

      toast({
        title: "Ticket criado!",
        description: "Responderemos em breve."
      });
      setTickets([data, ...tickets]);
      setNewTicket({ title: "", description: "", category: "", priority: "medium" });
      setUploadedImages([]);
      setIsCreateDialogOpen(false);
    }
  };

  const handleEditTicket = async () => {
    if (!editingTicket) return;

    const { error } = await supabase
      .from('tickets')
      .update({
        title: editingTicket.title,
        description: editingTicket.description,
        category: editingTicket.category,
        priority: editingTicket.priority
      })
      .eq('id', editingTicket.id);

    if (error) {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Ticket atualizado!"
      });
      fetchTickets();
      setIsEditDialogOpen(false);
      setEditingTicket(null);
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    if (!confirm('Tem certeza que deseja excluir este ticket?')) return;

    const { error } = await supabase
      .from('tickets')
      .delete()
      .eq('id', ticketId);

    if (error) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Ticket excluído!"
      });
      fetchTickets();
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(null);
      }
    }
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && messageAttachments.length === 0) || !selectedTicket) return;

    const { error } = await supabase
      .from('ticket_messages')
      .insert({
        ticket_id: selectedTicket.id,
        user_id: user!.id,
        message: newMessage || "Anexo enviado",
        is_admin: false,
        attachments: messageAttachments.length > 0 ? messageAttachments : null
      });

    if (error) {
      toast({
        title: "Erro ao enviar",
        description: error.message,
        variant: "destructive"
      });
    } else {
      setNewMessage("");
      setMessageAttachments([]);
    }
  };

  const handleMessageAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newAttachments: { url: string; name: string }[] = [];

    for (const file of Array.from(files)) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user!.id}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('chatbot-media')
        .upload(fileName, file);

      if (error) {
        toast({
          title: "Erro ao fazer upload",
          description: error.message,
          variant: "destructive"
        });
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from('chatbot-media')
          .getPublicUrl(fileName);
        newAttachments.push({ url: publicUrl, name: file.name });
      }
    }

    setMessageAttachments([...messageAttachments, ...newAttachments]);
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
                <Select value={newTicket.category} onValueChange={(v) => setNewTicket({ ...newTicket, category: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tecnico">Técnico</SelectItem>
                    <SelectItem value="financeiro">Financeiro</SelectItem>
                    <SelectItem value="suporte">Suporte</SelectItem>
                    <SelectItem value="duvida">Dúvida</SelectItem>
                    <SelectItem value="bug">Bug/Erro</SelectItem>
                    <SelectItem value="sugestao">Sugestão</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
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
              <div>
                <Label>Anexar Imagens/Prints (opcional)</Label>
                <div className="mt-2">
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="cursor-pointer"
                  />
                  {uploadedImages.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {uploadedImages.map((url, idx) => (
                        <div key={idx} className="relative">
                          <img src={url} alt={`Upload ${idx + 1}`} className="w-20 h-20 object-cover rounded border" />
                          <Button
                            size="icon"
                            variant="destructive"
                            className="absolute -top-2 -right-2 h-5 w-5 rounded-full"
                            onClick={() => setUploadedImages(uploadedImages.filter((_, i) => i !== idx))}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <Button onClick={handleCreateTicket} className="w-full gradient-primary">
                <Plus className="w-4 h-4 mr-2" />
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
                    <div className="flex-1">
                      <h4 className="font-semibold">{ticket.title}</h4>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingTicket(ticket);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTicket(ticket.id);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
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
                          ? 'bg-green-600 text-white'
                          : 'bg-green-600 text-white'
                      }`}
                    >
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

              {messageAttachments.length > 0 && (
                <div className="flex gap-2 mb-2">
                  {messageAttachments.map((att, idx) => (
                    <div key={idx} className="relative">
                      <img src={att.url} alt={att.name} className="w-16 h-16 object-cover rounded border" />
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute -top-2 -right-2 h-4 w-4 rounded-full text-xs"
                        onClick={() => setMessageAttachments(messageAttachments.filter((_, i) => i !== idx))}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleMessageAttachment}
                  className="hidden"
                  id="message-attachment"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => document.getElementById('message-attachment')?.click()}
                >
                  <Paperclip className="w-4 h-4" />
                </Button>
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

      {/* Dialog de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Ticket</DialogTitle>
          </DialogHeader>
          {editingTicket && (
            <div className="space-y-4 mt-4">
              <div>
                <Label>Título *</Label>
                <Input
                  value={editingTicket.title}
                  onChange={(e) => setEditingTicket({ ...editingTicket, title: e.target.value })}
                />
              </div>
              <div>
                <Label>Descrição *</Label>
                <Textarea
                  value={editingTicket.description}
                  onChange={(e) => setEditingTicket({ ...editingTicket, description: e.target.value })}
                  rows={4}
                />
              </div>
              <div>
                <Label>Categoria</Label>
                <Select 
                  value={editingTicket.category || ""} 
                  onValueChange={(v) => setEditingTicket({ ...editingTicket, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tecnico">Técnico</SelectItem>
                    <SelectItem value="financeiro">Financeiro</SelectItem>
                    <SelectItem value="suporte">Suporte</SelectItem>
                    <SelectItem value="duvida">Dúvida</SelectItem>
                    <SelectItem value="bug">Bug/Erro</SelectItem>
                    <SelectItem value="sugestao">Sugestão</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Prioridade</Label>
                <Select 
                  value={editingTicket.priority} 
                  onValueChange={(v) => setEditingTicket({ ...editingTicket, priority: v })}
                >
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
              <Button onClick={handleEditTicket} className="w-full gradient-primary">
                Salvar Alterações
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
