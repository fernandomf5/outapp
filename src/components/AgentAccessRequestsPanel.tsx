import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { CheckCircle, XCircle, Clock, User, Mail, Phone, Ban, Trash2, RefreshCw } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface AccessRequest {
  id: string;
  agent_id: string;
  customer_id: string;
  status: 'pending' | 'approved' | 'rejected';
  requested_at: string;
  reviewed_at: string | null;
  notes: string | null;
  access_duration_days: number | null;
  expires_at: string | null;
  is_active: boolean | null;
  agent_customers: {
    name: string;
    email: string;
    phone: string | null;
  };
}

export function AgentAccessRequestsPanel({ agentId }: { agentId: string }) {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [accessDays, setAccessDays] = useState<Record<string, number>>({});
  const { toast } = useToast();

  useEffect(() => {
    loadRequests();
    setupRealtimeSubscription();
  }, [agentId]);

  const loadRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('agent_access_requests')
        .select(`
          *,
          agent_customers (
            name,
            email,
            phone
          )
        `)
        .eq('agent_id', agentId)
        .order('requested_at', { ascending: false });

      if (error) throw error;
      setRequests(data as AccessRequest[] || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('agent-access-requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agent_access_requests',
          filter: `agent_id=eq.${agentId}`,
        },
        () => {
          loadRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleApprove = async (requestId: string) => {
    setProcessing(requestId);
    try {
      const days = accessDays[requestId] || 30; // Default 30 dias
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + days);

      const { error } = await supabase
        .from('agent_access_requests')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          notes: notes[requestId] || null,
          access_duration_days: days,
          expires_at: expiresAt.toISOString(),
          is_active: true,
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "✅ Aprovado!",
        description: `Acesso liberado por ${days} dias.`,
      });

      loadRequests();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (requestId: string) => {
    setProcessing(requestId);
    try {
      const { error } = await supabase
        .from('agent_access_requests')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          notes: notes[requestId] || null,
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "❌ Recusado",
        description: "A solicitação foi recusada.",
      });

      loadRequests();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleDisable = async (requestId: string) => {
    setProcessing(requestId);
    try {
      const { error } = await supabase
        .from('agent_access_requests')
        .update({ is_active: false })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Acesso Desabilitado",
        description: "O acesso foi desabilitado com sucesso.",
      });

      loadRequests();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleEnable = async (requestId: string) => {
    setProcessing(requestId);
    try {
      const { error } = await supabase
        .from('agent_access_requests')
        .update({ is_active: true })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Acesso Habilitado",
        description: "O acesso foi habilitado com sucesso.",
      });

      loadRequests();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const [deleteRequestId, setDeleteRequestId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteRequestId) return;
    
    setProcessing(deleteRequestId);
    try {
      // Buscar o customer_id da solicitação antes de excluir
      const { data: requestData } = await supabase
        .from('agent_access_requests')
        .select('customer_id')
        .eq('id', deleteRequestId)
        .single();

      const { error } = await supabase
        .from('agent_access_requests')
        .delete()
        .eq('id', deleteRequestId);

      if (error) throw error;

      // Se houver customer_id, excluir o customer também para permitir novo cadastro
      if (requestData?.customer_id) {
        await supabase
          .from('agent_customers')
          .delete()
          .eq('id', requestData.customer_id);
      }

      toast({
        title: "Acesso Excluído",
        description: "A solicitação foi excluída e o usuário poderá se cadastrar novamente.",
      });

      loadRequests();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
      setDeleteRequestId(null);
    }
  };

  const getStatusBadge = (request: AccessRequest) => {
    if (request.status === 'approved') {
      if (request.is_active === false) {
        return <Badge variant="secondary"><Ban className="w-3 h-3 mr-1" />Desabilitado</Badge>;
      }
      if (request.expires_at && new Date(request.expires_at) < new Date()) {
        return <Badge variant="destructive"><Clock className="w-3 h-3 mr-1" />Expirado</Badge>;
      }
      return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Aprovado</Badge>;
    }
    if (request.status === 'rejected') {
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Recusado</Badge>;
    }
    return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
  };

  if (loading) {
    return <div className="flex justify-center py-8">Carregando solicitações...</div>;
  }

  if (requests.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Nenhuma solicitação de acesso ainda.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Solicitações de Acesso</h3>
      {requests.map((request) => (
        <Card key={request.id} className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="font-semibold">{request.agent_customers.name}</span>
                {getStatusBadge(request)}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span>{request.agent_customers.email}</span>
              </div>
              {request.agent_customers.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <span>{request.agent_customers.phone}</span>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Solicitado em: {new Date(request.requested_at).toLocaleString('pt-BR')}
              </p>
              {request.reviewed_at && (
                <p className="text-xs text-muted-foreground">
                  Revisado em: {new Date(request.reviewed_at).toLocaleString('pt-BR')}
                </p>
              )}
              {request.status === 'approved' && request.access_duration_days && (
                <p className="text-xs text-muted-foreground">
                  Acesso liberado por: {request.access_duration_days} dias
                </p>
              )}
              {request.expires_at && (
                <p className="text-xs text-muted-foreground">
                  Expira em: {new Date(request.expires_at).toLocaleString('pt-BR')}
                </p>
              )}
              {request.notes && (
                <div className="mt-2 p-3 bg-muted rounded-lg">
                  <p className="text-sm">{request.notes}</p>
                </div>
              )}
            </div>

            {request.status === 'pending' && (
              <div className="space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-green-500 hover:bg-green-600 text-white"
                  onClick={() => handleApprove(request.id)}
                  disabled={processing === request.id}
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Aprovar
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleReject(request.id)}
                  disabled={processing === request.id}
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Recusar
                </Button>
              </div>
            )}

            {request.status === 'approved' && request.is_active && (
              <div className="space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDisable(request.id)}
                  disabled={processing === request.id}
                >
                  <Ban className="w-4 h-4 mr-1" />
                  Desabilitar
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setDeleteRequestId(request.id)}
                  disabled={processing === request.id}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Excluir
                </Button>
              </div>
            )}

            {request.status === 'approved' && request.is_active === false && (
              <div className="space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-green-500 hover:bg-green-600 text-white"
                  onClick={() => handleEnable(request.id)}
                  disabled={processing === request.id}
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Habilitar
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setDeleteRequestId(request.id)}
                  disabled={processing === request.id}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Excluir
                </Button>
              </div>
            )}
          </div>

          {(request.status === 'pending' || request.status === 'approved') && (
            <div className="space-y-3 mt-4 pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor={`days-${request.id}`}>
                  {request.status === 'pending' ? 'Dias de acesso' : 'Duração do acesso (dias)'}
                </Label>
                <Input
                  id={`days-${request.id}`}
                  type="number"
                  min="1"
                  value={accessDays[request.id] || request.access_duration_days || 30}
                  onChange={(e) => setAccessDays({ ...accessDays, [request.id]: parseInt(e.target.value) || 30 })}
                  placeholder="Número de dias"
                  disabled={request.status === 'approved'}
                />
                <p className="text-xs text-muted-foreground">
                  {request.status === 'pending' 
                    ? `O acesso será válido por ${accessDays[request.id] || 30} dias após a aprovação`
                    : `Acesso válido por ${request.access_duration_days || 30} dias`
                  }
                </p>
              </div>
              {request.status === 'pending' && (
                <div className="space-y-2">
                  <Label htmlFor={`notes-${request.id}`}>Observações (opcional)</Label>
                  <Textarea
                    id={`notes-${request.id}`}
                    value={notes[request.id] || ''}
                    onChange={(e) => setNotes({ ...notes, [request.id]: e.target.value })}
                    placeholder="Adicione observações sobre esta solicitação..."
                    rows={2}
                  />
                </div>
              )}
            </div>
          )}
        </Card>
      ))}

      <DeleteConfirmDialog
        open={!!deleteRequestId}
        onOpenChange={() => setDeleteRequestId(null)}
        onConfirm={handleDelete}
        description="Você tem certeza que deseja excluir esta solicitação de acesso? Esta ação não pode ser desfeita."
      />
    </div>
  );
}