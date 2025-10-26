import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, XCircle, Clock, User, Mail, Phone } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface AccessRequest {
  id: string;
  chatbot_id: string;
  customer_id: string;
  status: 'pending' | 'approved' | 'rejected';
  requested_at: string;
  reviewed_at: string | null;
  notes: string | null;
  chatbot_customers: {
    name: string;
    email: string;
    phone: string | null;
  };
}

export function ChatbotAccessRequestsPanel({ chatbotId }: { chatbotId: string }) {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    loadRequests();
    setupRealtimeSubscription();
  }, [chatbotId]);

  const loadRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('chatbot_access_requests')
        .select(`
          *,
          chatbot_customers (
            name,
            email,
            phone
          )
        `)
        .eq('chatbot_id', chatbotId)
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
      .channel('chatbot-access-requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chatbot_access_requests',
          filter: `chatbot_id=eq.${chatbotId}`,
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
      const { error } = await supabase
        .from('chatbot_access_requests')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          notes: notes[requestId] || null,
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "✅ Aprovado!",
        description: "O acesso foi aprovado com sucesso.",
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
        .from('chatbot_access_requests')
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Aprovado</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Recusado</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
    }
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
                <span className="font-semibold">{request.chatbot_customers.name}</span>
                {getStatusBadge(request.status)}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span>{request.chatbot_customers.email}</span>
              </div>
              {request.chatbot_customers.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <span>{request.chatbot_customers.phone}</span>
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
        </Card>
      ))}
    </div>
  );
}