import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Mail, Phone, User, Calendar, ExternalLink } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Lead {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  utm_source: string | null;
  utm_campaign: string | null;
  created_at: string;
}

interface LeadsManagerProps {
  pageId: string;
}

export const LeadsManager = ({ pageId }: LeadsManagerProps) => {
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeads();
  }, [pageId]);

  const fetchLeads = async () => {
    const { data, error } = await supabase
      .from('cloned_page_leads')
      .select('*')
      .eq('page_id', pageId)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Erro ao carregar leads",
        description: error.message,
        variant: "destructive"
      });
    } else {
      setLeads(data || []);
    }
    setLoading(false);
  };

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    const { error } = await supabase
      .from('cloned_page_leads')
      .update({ status: newStatus })
      .eq('id', leadId);

    if (error) {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({ title: "Status atualizado!" });
      fetchLeads();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'default';
      case 'contacted': return 'secondary';
      case 'converted': return 'default';
      case 'lost': return 'destructive';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'new': return 'Novo';
      case 'contacted': return 'Contatado';
      case 'converted': return 'Convertido';
      case 'lost': return 'Perdido';
      default: return status;
    }
  };

  if (loading) {
    return <div className="text-center py-8">Carregando leads...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Leads Capturados ({leads.length})</h3>
        <Button size="sm" variant="outline" onClick={fetchLeads}>
          Atualizar
        </Button>
      </div>

      {leads.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Nenhum lead capturado ainda</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => (
            <Card key={lead.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {lead.name && (
                      <div className="flex items-center gap-1 text-sm">
                        <User className="w-4 h-4" />
                        <span className="font-medium">{lead.name}</span>
                      </div>
                    )}
                    <Badge variant={getStatusColor(lead.status)}>
                      {getStatusLabel(lead.status)}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    {lead.email && (
                      <a href={`mailto:${lead.email}`} className="flex items-center gap-1 hover:text-primary">
                        <Mail className="w-4 h-4" />
                        {lead.email}
                      </a>
                    )}
                    {lead.phone && (
                      <a href={`tel:${lead.phone}`} className="flex items-center gap-1 hover:text-primary">
                        <Phone className="w-4 h-4" />
                        {lead.phone}
                      </a>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                    </div>
                  </div>

                  {(lead.utm_source || lead.utm_campaign) && (
                    <div className="flex gap-2 text-xs">
                      {lead.utm_source && (
                        <Badge variant="outline">Fonte: {lead.utm_source}</Badge>
                      )}
                      {lead.utm_campaign && (
                        <Badge variant="outline">Campanha: {lead.utm_campaign}</Badge>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <Select
                    value={lead.status}
                    onValueChange={(value) => updateLeadStatus(lead.id, value)}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">Novo</SelectItem>
                      <SelectItem value="contacted">Contatado</SelectItem>
                      <SelectItem value="converted">Convertido</SelectItem>
                      <SelectItem value="lost">Perdido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};