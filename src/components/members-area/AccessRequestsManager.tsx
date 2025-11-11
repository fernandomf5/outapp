import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface AccessRequest {
  id: string;
  email: string;
  status: 'pending' | 'approved' | 'denied';
  requested_at: string;
  reviewed_at?: string;
  notes?: string;
  access_code?: string;
}

interface AccessRequestsManagerProps {
  areaId: string;
}

export function AccessRequestsManager({ areaId }: AccessRequestsManagerProps) {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");

  useEffect(() => {
    loadRequests();
  }, [areaId]);

  const loadRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('members_area_access_requests')
        .select('*')
        .eq('area_id', areaId)
        .order('requested_at', { ascending: false });

      if (error) throw error;
      setRequests((data as any) || []);
    } catch (error: any) {
      toast.error('Erro ao carregar solicitações: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (requestId: string, newStatus: 'approved' | 'denied') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Buscar dados atuais
      const { data: currentRequest } = await supabase
        .from('members_area_access_requests')
        .select('notes, email')
        .eq('id', requestId)
        .single();

      const updatedNotes = reviewNotes 
        ? `${currentRequest?.notes || ''}\n\nNotas do revisor: ${reviewNotes}`.trim()
        : currentRequest?.notes || '';

      // Gerar código de acesso se aprovado
      let accessCode = null;
      if (newStatus === 'approved') {
        const { data: codeData } = await supabase
          .rpc('generate_access_code' as any);
        accessCode = codeData;
      }

      const { error } = await supabase
        .from('members_area_access_requests')
        .update({
          status: newStatus,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
          notes: updatedNotes,
          ...(accessCode && { access_code: accessCode })
        })
        .eq('id', requestId);

      if (error) throw error;

      if (newStatus === 'approved' && accessCode) {
        toast.success(`Acesso aprovado! Código de acesso: ${accessCode}`, {
          duration: 10000,
        });
        // TODO: Enviar email com código de acesso
        console.log(`Email: ${currentRequest?.email}, Código: ${accessCode}`);
      } else {
        toast.success(`Acesso ${newStatus === 'approved' ? 'aprovado' : 'negado'}!`);
      }
      
      setSelectedRequest(null);
      setReviewNotes("");
      loadRequests();
    } catch (error: any) {
      toast.error('Erro ao processar solicitação: ' + error.message);
    }
  };

  const handleDelete = async (requestId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta solicitação?')) return;

    try {
      const { error } = await supabase
        .from('members_area_access_requests')
        .delete()
        .eq('id', requestId);

      if (error) throw error;

      toast.success('Solicitação excluída!');
      loadRequests();
    } catch (error: any) {
      toast.error('Erro ao excluir: ' + error.message);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { variant: "secondary" as const, icon: Clock, text: "Pendente" },
      approved: { variant: "default" as const, icon: CheckCircle, text: "Aprovado" },
      denied: { variant: "destructive" as const, icon: XCircle, text: "Negado" }
    };

    const config = variants[status as keyof typeof variants];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {config.text}
      </Badge>
    );
  };

  if (loading) {
    return <div className="text-center p-4">Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Solicitações de Acesso</CardTitle>
          <CardDescription>
            Gerencie as solicitações de acesso à sua área de membros
          </CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhuma solicitação de acesso ainda
            </p>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <Card key={request.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <p className="font-medium">{request.email}</p>
                          {getStatusBadge(request.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Solicitado em: {new Date(request.requested_at).toLocaleString('pt-BR')}
                        </p>
                        {request.reviewed_at && (
                          <p className="text-sm text-muted-foreground">
                            Revisado em: {new Date(request.reviewed_at).toLocaleString('pt-BR')}
                          </p>
                        )}
                        {request.notes && (
                          <p className="text-sm mt-2">
                            <strong>Notas:</strong> {request.notes}
                          </p>
                        )}
                        {request.access_code && request.status === 'approved' && (
                          <p className="text-sm mt-2 font-mono bg-muted p-2 rounded">
                            <strong>Código de Acesso:</strong> {request.access_code}
                          </p>
                        )}

                        {request.status === 'pending' && selectedRequest === request.id && (
                          <div className="mt-4 space-y-3">
                            <div>
                              <Label>Notas (opcional)</Label>
                              <Textarea
                                value={reviewNotes}
                                onChange={(e) => setReviewNotes(e.target.value)}
                                placeholder="Adicione notas sobre esta decisão..."
                                rows={2}
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleReview(request.id, 'approved')}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Aprovar
                              </Button>
                              <Button
                                onClick={() => handleReview(request.id, 'denied')}
                                variant="destructive"
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Negar
                              </Button>
                              <Button
                                onClick={() => {
                                  setSelectedRequest(null);
                                  setReviewNotes("");
                                }}
                                variant="outline"
                              >
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {request.status === 'pending' && selectedRequest !== request.id && (
                          <Button
                            onClick={() => setSelectedRequest(request.id)}
                            size="sm"
                          >
                            Revisar
                          </Button>
                        )}
                        <Button
                          onClick={() => handleDelete(request.id)}
                          variant="ghost"
                          size="sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}