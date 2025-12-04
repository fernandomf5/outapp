import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, Phone, Mail, Edit, Trash2, Filter } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  sourceName: string;
  createdAt: string;
  originalId?: string;
  originalSource?: string;
}

export function GeneralCRMPanel() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<string>("all");

  // Get unique sources for filter dropdown
  const uniqueSources = useMemo(() => {
    const sources = [...new Set(leads.map(lead => lead.source))];
    return sources.sort();
  }, [leads]);

  // Filtered leads based on source filter
  const filteredLeads = useMemo(() => {
    if (sourceFilter === "all") return leads;
    return leads.filter(lead => lead.source === sourceFilter);
  }, [leads, sourceFilter]);

  useEffect(() => {
    if (!user) return;
    fetchAllLeads();
  }, [user]);

  const fetchAllLeads = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const allLeads: Lead[] = [];

      // 1. Buscar leads de conversas de chatbots
      const { data: chatbots } = await supabase
        .from('chatbots')
        .select('id, name')
        .eq('user_id', user.id);

      if (chatbots && chatbots.length > 0) {
        const chatbotIds = chatbots.map(c => c.id);
        
        const { data: chatbotConversations } = await supabase
          .from('chatbot_conversations')
          .select('id, visitor_name, visitor_email, visitor_phone, chatbot_id, created_at')
          .in('chatbot_id', chatbotIds)
          .not('visitor_name', 'is', null);

        if (chatbotConversations) {
          chatbotConversations.forEach(conv => {
            const chatbot = chatbots.find(c => c.id === conv.chatbot_id);
            if (conv.visitor_name || conv.visitor_email || conv.visitor_phone) {
              allLeads.push({
                id: `chatbot-${conv.id}`,
                originalId: conv.id,
                originalSource: 'chatbot_conversations',
                name: conv.visitor_name || 'N/A',
                email: conv.visitor_email || 'N/A',
                phone: conv.visitor_phone || 'N/A',
                source: 'Chatbot',
                sourceName: chatbot?.name || 'Chatbot',
                createdAt: conv.created_at
              });
            }
          });
        }
      }

      // 2. Buscar leads de agentes IA
      const { data: agents } = await supabase
        .from('ai_agents')
        .select('id, name')
        .eq('user_id', user.id);

      if (agents && agents.length > 0) {
        const agentIds = agents.map(a => a.id);
        
        const { data: agentCustomers } = await supabase
          .from('agent_customers')
          .select('id, name, email, phone, agent_id, created_at')
          .in('agent_id', agentIds);

        if (agentCustomers) {
          agentCustomers.forEach(customer => {
            const agent = agents.find(a => a.id === customer.agent_id);
            allLeads.push({
              id: `agent-${customer.id}`,
              originalId: customer.id,
              originalSource: 'agent_customers',
              name: customer.name || 'N/A',
              email: customer.email || 'N/A',
              phone: customer.phone || 'N/A',
              source: 'Agente IA',
              sourceName: agent?.name || 'Agente IA',
              createdAt: customer.created_at
            });
          });
        }
      }

      // 3. Buscar leads de páginas clonadas
      const { data: clonedPages } = await supabase
        .from('cloned_pages')
        .select('id')
        .eq('user_id', user.id);

      if (clonedPages && clonedPages.length > 0) {
        const pageIds = clonedPages.map(p => p.id);
        
        const { data: pageLeads } = await supabase
          .from('cloned_page_leads')
          .select('id, name, email, phone, page_id, created_at')
          .in('page_id', pageIds);

        if (pageLeads) {
          pageLeads.forEach(lead => {
            allLeads.push({
              id: `page-${lead.id}`,
              originalId: lead.id,
              originalSource: 'cloned_page_leads',
              name: lead.name || 'N/A',
              email: lead.email || 'N/A',
              phone: lead.phone || 'N/A',
              source: 'Página Clonada',
              sourceName: 'Página Clonada',
              createdAt: lead.created_at
            });
          });
        }
      }

      // Ordenar por data mais recente
      allLeads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setLeads(allLeads);
    } catch (error) {
      console.error('Erro ao buscar leads:', error);
      toast.error('Erro ao carregar leads');
    } finally {
      setLoading(false);
    }
  };

  const downloadPhones = () => {
    const phones = filteredLeads
      .filter(lead => lead.phone && lead.phone !== 'N/A')
      .map(lead => lead.phone)
      .join('\n');

    const blob = new Blob([phones], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `telefones-leads${sourceFilter !== 'all' ? `-${sourceFilter}` : ''}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Telefones baixados com sucesso!');
  };

  const downloadEmails = () => {
    const emails = filteredLeads
      .filter(lead => lead.email && lead.email !== 'N/A')
      .map(lead => lead.email)
      .join('\n');

    const blob = new Blob([emails], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `emails-leads${sourceFilter !== 'all' ? `-${sourceFilter}` : ''}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('E-mails baixados com sucesso!');
  };

  const deleteLead = async (lead: Lead) => {
    if (!confirm(`Tem certeza que deseja excluir o lead de ${lead.name}?`)) return;

    if (!lead.originalSource || !lead.originalId) {
      toast.error('Não foi possível identificar a origem do lead');
      return;
    }

    const { error } = await supabase
      .from(lead.originalSource as any)
      .delete()
      .eq('id', lead.originalId);

    if (error) {
      toast.error('Erro ao excluir lead: ' + error.message);
    } else {
      toast.success('Lead excluído com sucesso');
      fetchAllLeads();
    }
  };

  const openEditDialog = (lead: Lead) => {
    setEditingLead(lead);
    setEditDialogOpen(true);
  };

  const updateLead = async () => {
    if (!editingLead || !editingLead.originalSource || !editingLead.originalId) return;

    let updateData: any = {};
    
    // Mapear campos de acordo com a tabela de origem
    if (editingLead.originalSource === 'chatbot_conversations') {
      updateData = {
        visitor_name: editingLead.name,
        visitor_email: editingLead.email,
        visitor_phone: editingLead.phone,
      };
    } else {
      updateData = {
        name: editingLead.name,
        email: editingLead.email,
        phone: editingLead.phone,
      };
    }

    const { error } = await supabase
      .from(editingLead.originalSource as any)
      .update(updateData)
      .eq('id', editingLead.originalId);

    if (error) {
      toast.error('Erro ao atualizar lead: ' + error.message);
    } else {
      toast.success('Lead atualizado com sucesso');
      setEditDialogOpen(false);
      fetchAllLeads();
    }
  };

  const downloadAllLeads = () => {
    const csv = [
      'Nome,Email,Telefone,Origem,Fonte,Data',
      ...filteredLeads.map(lead => 
        `"${lead.name}","${lead.email}","${lead.phone}","${lead.source}","${lead.sourceName}","${new Date(lead.createdAt).toLocaleString('pt-BR')}"`
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads${sourceFilter !== 'all' ? `-${sourceFilter}` : ''}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Leads baixados com sucesso!');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Controle de Leads</CardTitle>
          <CardDescription>
            Todos os leads capturados de chatbots, agentes IA e páginas clonadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por origem" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as origens</SelectItem>
                  {uniqueSources.map(source => (
                    <SelectItem key={source} value={source}>{source}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={downloadPhones} variant="outline" size="sm">
                <Phone className="h-4 w-4 mr-2" />
                Baixar Telefones
              </Button>
              <Button onClick={downloadEmails} variant="outline" size="sm">
                <Mail className="h-4 w-4 mr-2" />
                Baixar E-mails
              </Button>
              <Button onClick={downloadAllLeads} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Baixar CSV
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando leads...
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {sourceFilter !== "all" ? "Nenhum lead encontrado para esta origem" : "Nenhum lead capturado ainda"}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Fonte</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">{lead.name}</TableCell>
                      <TableCell>{lead.email}</TableCell>
                      <TableCell>{lead.phone}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{lead.source}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {lead.sourceName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(lead.createdAt).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(lead)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteLead(lead)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="mt-4 text-sm text-muted-foreground">
            {sourceFilter !== "all" ? (
              <>Mostrando <span className="font-semibold">{filteredLeads.length}</span> de <span className="font-semibold">{leads.length}</span> leads</>
            ) : (
              <>Total de leads: <span className="font-semibold">{leads.length}</span></>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Lead</DialogTitle>
          </DialogHeader>
          {editingLead && (
            <div className="space-y-4">
              <div>
                <Label>Nome</Label>
                <Input
                  value={editingLead.name}
                  onChange={(e) => setEditingLead({ ...editingLead, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  value={editingLead.email || ''}
                  onChange={(e) => setEditingLead({ ...editingLead, email: e.target.value })}
                />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input
                  value={editingLead.phone || ''}
                  onChange={(e) => setEditingLead({ ...editingLead, phone: e.target.value })}
                />
              </div>
              <Button onClick={updateLead} className="w-full">
                Salvar Alterações
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
