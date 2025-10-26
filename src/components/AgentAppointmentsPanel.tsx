import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, User, Phone, Mail, CheckCircle, XCircle, Printer, FileText } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Appointment {
  id: string;
  service_name: string;
  service_description: string;
  scheduled_date: string;
  status: string;
  customer_notes: string;
  created_at: string;
  agent_customers: {
    name: string;
    email: string;
    phone: string;
  };
}

export default function AgentAppointmentsPanel({ agentId }: { agentId: string }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadAppointments();
    setupRealtimeSubscription();
  }, [agentId]);

  const loadAppointments = async () => {
    const { data, error } = await supabase
      .from('agent_appointments')
      .select(`
        *,
        agent_customers (
          name,
          email,
          phone
        )
      `)
      .eq('agent_id', agentId)
      .order('scheduled_date', { ascending: true });

    if (error) {
      toast({
        title: "Erro ao carregar agendamentos",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setAppointments(data || []);
    }
    setLoading(false);
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('agent-appointments')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agent_appointments',
          filter: `agent_id=eq.${agentId}`,
        },
        () => {
          loadAppointments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const updateStatus = async (appointmentId: string, newStatus: string) => {
    const { error } = await supabase
      .from('agent_appointments')
      .update({ status: newStatus })
      .eq('id', appointmentId);

    if (error) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Status atualizado!",
        description: "Agendamento atualizado com sucesso.",
      });
      loadAppointments();
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500",
      confirmed: "bg-blue-500",
      cancelled: "bg-red-500",
      completed: "bg-green-500",
    };
    return colors[status] || "bg-gray-500";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "Pendente",
      confirmed: "Confirmado",
      cancelled: "Cancelado",
      completed: "Concluído",
    };
    return labels[status] || status;
  };

  const printAppointment = (appointment: Appointment) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Agendamento - ${appointment.service_name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
            h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
            .section { margin: 20px 0; }
            .label { font-weight: bold; color: #666; }
            .value { margin-left: 10px; }
            .status { display: inline-block; padding: 5px 15px; border-radius: 20px; font-weight: bold; }
            .status-confirmed { background: #3b82f6; color: white; }
            .status-pending { background: #eab308; color: white; }
            .status-cancelled { background: #ef4444; color: white; }
            .status-completed { background: #22c55e; color: white; }
            .info-row { margin: 10px 0; display: flex; align-items: center; }
            .notes { background: #f5f5f5; padding: 15px; border-radius: 8px; margin-top: 20px; }
            @media print {
              body { padding: 20px; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📅 Agendamento</h1>
            <button onclick="window.print()" style="padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 5px; cursor: pointer;">Imprimir</button>
          </div>
          
          <div class="section">
            <p class="info-row"><span class="label">ID:</span><span class="value">#${appointment.id.substring(0, 8)}</span></p>
            <p class="info-row"><span class="label">Status:</span> <span class="status status-${appointment.status}">${getStatusLabel(appointment.status)}</span></p>
          </div>

          <div class="section">
            <h2>🎯 Serviço</h2>
            <p class="info-row"><span class="label">Nome:</span><span class="value">${appointment.service_name}</span></p>
            ${appointment.service_description ? `<p class="info-row"><span class="label">Descrição:</span><span class="value">${appointment.service_description}</span></p>` : ''}
          </div>

          <div class="section">
            <h2>📆 Data e Hora</h2>
            <p class="info-row"><span class="label">Data:</span><span class="value">${new Date(appointment.scheduled_date).toLocaleDateString('pt-BR')}</span></p>
            <p class="info-row"><span class="label">Hora:</span><span class="value">${new Date(appointment.scheduled_date).toLocaleTimeString('pt-BR')}</span></p>
          </div>

          <div class="section">
            <h2>👤 Dados do Cliente</h2>
            <p class="info-row"><span class="label">Nome:</span><span class="value">${appointment.agent_customers.name}</span></p>
            <p class="info-row"><span class="label">Email:</span><span class="value">${appointment.agent_customers.email}</span></p>
            ${appointment.agent_customers.phone ? `<p class="info-row"><span class="label">Telefone:</span><span class="value">${appointment.agent_customers.phone}</span></p>` : ''}
          </div>

          ${appointment.customer_notes ? `
          <div class="section">
            <h2>📝 Observações do Cliente</h2>
            <div class="notes">${appointment.customer_notes}</div>
          </div>
          ` : ''}

          <div class="section" style="margin-top: 40px; color: #999; font-size: 12px;">
            <p>Agendamento criado em: ${new Date(appointment.created_at).toLocaleString('pt-BR')}</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  if (loading) {
    return <div>Carregando agendamentos...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold">Agendamentos</h3>
        <Badge variant="outline">{appointments.length} total</Badge>
      </div>

      {appointments.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhum agendamento ainda</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {appointments.map((appointment) => (
            <Card key={appointment.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{appointment.service_name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {appointment.service_description}
                    </p>
                  </div>
                  <Badge className={getStatusColor(appointment.status)}>
                    {getStatusLabel(appointment.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>{new Date(appointment.scheduled_date).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>{new Date(appointment.scheduled_date).toLocaleTimeString('pt-BR')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span>{appointment.agent_customers.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{appointment.agent_customers.email}</span>
                  </div>
                  {appointment.agent_customers.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{appointment.agent_customers.phone}</span>
                    </div>
                  )}
                  {appointment.customer_notes && (
                    <div className="mt-2 p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <p className="text-sm font-medium">Observações do Cliente:</p>
                      </div>
                      <p className="text-sm">{appointment.customer_notes}</p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Select
                      value={appointment.status}
                      onValueChange={(value) => updateStatus(appointment.id, value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="confirmed">Confirmar</SelectItem>
                        <SelectItem value="completed">Concluir</SelectItem>
                        <SelectItem value="cancelled">Cancelar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    onClick={() => printAppointment(appointment)}
                    variant="outline"
                    className="w-full mt-2"
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Imprimir Agendamento
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}