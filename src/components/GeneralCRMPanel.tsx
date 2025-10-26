import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, Phone, Mail } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  sourceName: string;
  createdAt: string;
}

export function GeneralCRMPanel() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

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
          .select('visitor_name, visitor_email, visitor_phone, chatbot_id, created_at')
          .in('chatbot_id', chatbotIds)
          .not('visitor_name', 'is', null);

        if (chatbotConversations) {
          chatbotConversations.forEach(conv => {
            const chatbot = chatbots.find(c => c.id === conv.chatbot_id);
            if (conv.visitor_name || conv.visitor_email || conv.visitor_phone) {
              allLeads.push({
                id: `chatbot-${conv.chatbot_id}-${conv.created_at}`,
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
    const phones = leads
      .filter(lead => lead.phone && lead.phone !== 'N/A')
      .map(lead => lead.phone)
      .join('\n');

    const blob = new Blob([phones], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'telefones-leads.txt';
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Telefones baixados com sucesso!');
  };

  const downloadEmails = () => {
    const emails = leads
      .filter(lead => lead.email && lead.email !== 'N/A')
      .map(lead => lead.email)
      .join('\n');

    const blob = new Blob([emails], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'emails-leads.txt';
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('E-mails baixados com sucesso!');
  };

  const downloadAllLeads = () => {
    const csv = [
      'Nome,Email,Telefone,Origem,Fonte,Data',
      ...leads.map(lead => 
        `"${lead.name}","${lead.email}","${lead.phone}","${lead.source}","${lead.sourceName}","${new Date(lead.createdAt).toLocaleString('pt-BR')}"`
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'todos-leads.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Todos os leads baixados com sucesso!');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>CRM Geral</CardTitle>
          <CardDescription>
            Todos os leads capturados de chatbots, agentes IA e páginas clonadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
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
              Baixar Todos (CSV)
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando leads...
            </div>
          ) : leads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum lead capturado ainda
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => (
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="mt-4 text-sm text-muted-foreground">
            Total de leads: <span className="font-semibold">{leads.length}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
