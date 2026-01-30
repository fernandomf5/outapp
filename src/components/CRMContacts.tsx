import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, UserPlus, Mail, Phone, Building, Trash2, MessageSquare, Download, History } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CustomerHistoryPanel } from "@/components/crm/CustomerHistoryPanel";

interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  position: string | null;
  tags: string[];
  notes: string | null;
  source: string | null;
  status: string;
  last_contact_at: string | null;
  created_at: string;
}

interface Interaction {
  id: string;
  type: string;
  notes: string | null;
  created_at: string;
}

export const CRMContacts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isInteractionDialogOpen, setIsInteractionDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [newContact, setNewContact] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    position: "",
    notes: "",
    source: "",
    status: "lead"
  });
  const [newInteraction, setNewInteraction] = useState({
    type: "call",
    notes: ""
  });

  useEffect(() => {
    if (user) {
      fetchContacts();
    }
  }, [user, statusFilter]);

  useEffect(() => {
    if (selectedContact) {
      fetchInteractions(selectedContact.id);
    }
  }, [selectedContact]);

  const fetchContacts = async () => {
    let query = supabase
      .from('contacts')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;

    if (!error && data) {
      const formattedContacts = data.map(c => ({
        ...c,
        tags: (Array.isArray(c.tags) ? c.tags : []) as string[]
      })) as Contact[];
      setContacts(formattedContacts);
    }
  };

  const fetchInteractions = async (contactId: string) => {
    const { data, error } = await supabase
      .from('contact_interactions')
      .select('*')
      .eq('contact_id', contactId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setInteractions(data);
    }
  };

  const handleCreateContact = async () => {
    if (!newContact.name) {
      toast({
        title: "Erro",
        description: "Nome é obrigatório",
        variant: "destructive"
      });
      return;
    }

    const { data, error } = await supabase
      .from('contacts')
      .insert({
        ...newContact,
        user_id: user!.id,
        tags: []
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Erro ao criar contato",
        description: error.message,
        variant: "destructive"
      });
    } else {
      const formattedContact: Contact = {
        ...data,
        tags: (Array.isArray(data.tags) ? data.tags : []) as string[]
      };
      toast({ title: "Contato criado com sucesso!" });
      setContacts([formattedContact, ...contacts]);
      setNewContact({ name: "", email: "", phone: "", company: "", position: "", notes: "", source: "", status: "lead" });
      setIsCreateDialogOpen(false);
    }
  };

  const handleAddInteraction = async () => {
    if (!selectedContact || !newInteraction.notes) return;

    const { error } = await supabase
      .from('contact_interactions')
      .insert({
        contact_id: selectedContact.id,
        user_id: user!.id,
        type: newInteraction.type,
        notes: newInteraction.notes
      });

    if (error) {
      toast({
        title: "Erro ao adicionar interação",
        description: error.message,
        variant: "destructive"
      });
    } else {
      await supabase
        .from('contacts')
        .update({ last_contact_at: new Date().toISOString() })
        .eq('id', selectedContact.id);

      toast({ title: "Interação registrada!" });
      setNewInteraction({ type: "call", notes: "" });
      setIsInteractionDialogOpen(false);
      fetchInteractions(selectedContact.id);
      fetchContacts();
    }
  };

  const handleDeleteContact = async (id: string) => {
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Erro ao deletar",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({ title: "Contato removido" });
      setContacts(contacts.filter(c => c.id !== id));
      if (selectedContact?.id === id) {
        setSelectedContact(null);
      }
    }
  };

  const handleExportCSV = () => {
    if (contacts.length === 0) {
      toast({
        title: "Nenhum contato para exportar",
        description: "Adicione contatos primeiro",
        variant: "destructive"
      });
      return;
    }

    // Criar CSV
    const headers = ["Nome", "Email", "Telefone", "Empresa", "Cargo", "Status", "Data de Criação"];
    const rows = contacts.map(c => [
      c.name,
      c.email || "",
      c.phone || "",
      c.company || "",
      c.position || "",
      c.status,
      new Date(c.created_at).toLocaleDateString('pt-BR')
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    // Download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `contatos_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({
      title: "Exportação concluída! 📊",
      description: `${contacts.length} contatos exportados com sucesso.`
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'lead': return 'bg-blue-500/20 text-blue-500';
      case 'prospect': return 'bg-yellow-500/20 text-yellow-500';
      case 'customer': return 'bg-green-500/20 text-green-500';
      case 'inactive': return 'bg-gray-500/20 text-gray-500';
      default: return 'bg-gray-500/20 text-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">CRM - Contatos</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExportCSV}
            disabled={contacts.length === 0}
            className="hover:bg-primary/10 hover:border-primary"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary">
              <UserPlus className="w-4 h-4 mr-2" />
              Novo Contato
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Contato</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Nome *</Label>
                <Input
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  placeholder="Nome completo"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={newContact.email}
                  onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input
                  value={newContact.phone}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div>
                <Label>Empresa</Label>
                <Input
                  value={newContact.company}
                  onChange={(e) => setNewContact({ ...newContact, company: e.target.value })}
                  placeholder="Nome da empresa"
                />
              </div>
              <div>
                <Label>Cargo</Label>
                <Input
                  value={newContact.position}
                  onChange={(e) => setNewContact({ ...newContact, position: e.target.value })}
                  placeholder="Cargo na empresa"
                />
              </div>
              <div>
                <Label>Origem</Label>
                <Input
                  value={newContact.source}
                  onChange={(e) => setNewContact({ ...newContact, source: e.target.value })}
                  placeholder="Ex: Indicação, Google, WhatsApp"
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={newContact.status} onValueChange={(v) => setNewContact({ ...newContact, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="prospect">Prospect</SelectItem>
                    <SelectItem value="customer">Cliente</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Observações</Label>
                <Textarea
                  value={newContact.notes}
                  onChange={(e) => setNewContact({ ...newContact, notes: e.target.value })}
                  placeholder="Notas sobre o contato"
                  rows={3}
                />
              </div>
              <Button onClick={handleCreateContact} className="w-full gradient-primary">
                Criar Contato
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="flex gap-4 items-center">
        <Label>Filtrar por Status:</Label>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="lead">Leads</SelectItem>
            <SelectItem value="prospect">Prospects</SelectItem>
            <SelectItem value="customer">Clientes</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Lista de Contatos */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Contatos ({contacts.length})</h3>
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {contacts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhum contato cadastrado</p>
            ) : (
              contacts.map((contact) => (
                <Card
                  key={contact.id}
                  className={`p-4 transition-smooth hover:shadow-lg ${
                    selectedContact?.id === contact.id ? 'border-primary bg-primary/5' : ''
                  }`}
                  onClick={() => setSelectedContact(contact)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold">{contact.name}</h4>
                      {contact.company && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Building className="w-3 h-3" />
                          {contact.company} {contact.position && `- ${contact.position}`}
                        </p>
                      )}
                    </div>
                    <Badge className={getStatusColor(contact.status)}>
                      {contact.status}
                    </Badge>
                  </div>
                  {contact.email && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {contact.email}
                    </p>
                  )}
                  {contact.phone && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {contact.phone}
                    </p>
                  )}
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteContact(contact.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </Card>

        {/* Detalhes do Contato */}
        <Card className="p-6">
          {selectedContact ? (
            <div className="space-y-4">
              <div className="border-b pb-4">
                <h3 className="font-semibold text-lg">{selectedContact.name}</h3>
                <Badge className={getStatusColor(selectedContact.status)}>
                  {selectedContact.status}
                </Badge>
              </div>

              <div className="space-y-2 text-sm">
                {selectedContact.email && <p><strong>Email:</strong> {selectedContact.email}</p>}
                {selectedContact.phone && <p><strong>Telefone:</strong> {selectedContact.phone}</p>}
                {selectedContact.company && <p><strong>Empresa:</strong> {selectedContact.company}</p>}
                {selectedContact.position && <p><strong>Cargo:</strong> {selectedContact.position}</p>}
                {selectedContact.source && <p><strong>Origem:</strong> {selectedContact.source}</p>}
                {selectedContact.notes && (
                  <div>
                    <strong>Observações:</strong>
                    <p className="mt-1 text-muted-foreground">{selectedContact.notes}</p>
                  </div>
                )}
              </div>

              <Tabs defaultValue="history" className="border-t pt-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="history" className="text-xs">
                    <History className="w-3 h-3 mr-1" /> Histórico
                  </TabsTrigger>
                  <TabsTrigger value="interactions" className="text-xs">
                    <MessageSquare className="w-3 h-3 mr-1" /> Interações
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="history" className="mt-4">
                  <CustomerHistoryPanel 
                    contactId={selectedContact.id} 
                    contactName={selectedContact.name} 
                  />
                </TabsContent>

                <TabsContent value="interactions" className="mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-sm">Interações</h4>
                    <Dialog open={isInteractionDialogOpen} onOpenChange={setIsInteractionDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <Plus className="w-4 h-4 mr-2" />
                          Adicionar
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Nova Interação</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                          <div>
                            <Label>Tipo</Label>
                            <Select value={newInteraction.type} onValueChange={(v) => setNewInteraction({ ...newInteraction, type: v })}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="call">Ligação</SelectItem>
                                <SelectItem value="email">Email</SelectItem>
                                <SelectItem value="meeting">Reunião</SelectItem>
                                <SelectItem value="message">Mensagem</SelectItem>
                                <SelectItem value="other">Outro</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Notas</Label>
                            <Textarea
                              value={newInteraction.notes}
                              onChange={(e) => setNewInteraction({ ...newInteraction, notes: e.target.value })}
                              placeholder="Descreva o que foi discutido..."
                              rows={4}
                            />
                          </div>
                          <Button onClick={handleAddInteraction} className="w-full gradient-primary">
                            Salvar Interação
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {interactions.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">Nenhuma interação registrada</p>
                    ) : (
                      interactions.map((interaction) => (
                        <Card key={interaction.id} className="p-3">
                          <div className="flex items-start gap-2">
                            <MessageSquare className="w-4 h-4 mt-0.5 text-primary" />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <Badge variant="outline" className="text-xs">
                                  {interaction.type}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(interaction.created_at).toLocaleDateString('pt-BR')}
                                </span>
                              </div>
                              <p className="text-sm mt-1 text-muted-foreground">{interaction.notes}</p>
                            </div>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground h-full">
              Selecione um contato para ver os detalhes
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
