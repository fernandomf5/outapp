import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, User, Phone, Mail, CheckCircle, XCircle, Printer, FileText, CalendarClock, Trash2, Edit } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Appointment {
  id: string;
  service_name: string;
  service_description: string;
  scheduled_date: string;
  proposed_date: string | null;
  response_type: string | null;
  status: string;
  customer_notes: string;
  created_at: string;
  conversation_id: string;
  agent_customers: {
    name: string;
    email: string;
    phone: string;
  };
}

export default function AgentAppointmentsPanel({ agentId }: { agentId: string }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateChangeDialog, setDateChangeDialog] = useState<{ open: boolean; appointmentId: string | null; }>({ open: false, appointmentId: null });
  const [editDialog, setEditDialog] = useState<{ open: boolean; appointment: Appointment | null; }>({ open: false, appointment: null });
  const [newProposedDate, setNewProposedDate] = useState("");
  const [newProposedTime, setNewProposedTime] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadAppointments();
    const cleanup = setupRealtimeSubscription();
    return cleanup;
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

  const approveAppointment = async (appointment: Appointment) => {
    const { error } = await supabase
      .from('agent_appointments')
      .update({ 
        status: 'confirmed',
        response_type: 'approved'
      })
      .eq('id', appointment.id);

    if (error) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    // Send approval message to customer
    if (appointment.conversation_id) {
      const { error: msgError } = await supabase.from('agent_messages').insert({
        conversation_id: appointment.conversation_id,
        role: 'agent',
        content: `✅ *Agendamento Aprovado!*\n\n👤 *Cliente:* ${appointment.agent_customers.name}\n📋 *Serviço:* ${appointment.service_name}\n📅 *Data/Hora:* ${new Date(appointment.scheduled_date).toLocaleString('pt-BR')}\n\nSeu agendamento foi confirmado com sucesso!`,
        sender_name: 'Sistema'
      });

      if (msgError) {
        console.error('Erro ao enviar mensagem:', msgError);
      }
    } else {
      console.warn('Agendamento sem conversation_id:', appointment.id);
    }

    toast({
      title: "Aprovado!",
      description: "Agendamento confirmado e cliente notificado.",
    });
    loadAppointments();
  };

  const rejectAppointment = async (appointment: Appointment) => {
    const { error } = await supabase
      .from('agent_appointments')
      .update({ 
        status: 'cancelled',
        response_type: 'rejected'
      })
      .eq('id', appointment.id);

    if (error) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    // Send rejection message to customer
    if (appointment.conversation_id) {
      const { error: msgError } = await supabase.from('agent_messages').insert({
        conversation_id: appointment.conversation_id,
        role: 'agent',
        content: `❌ *Agendamento Recusado*\n\n👤 *Cliente:* ${appointment.agent_customers.name}\n📋 *Serviço:* ${appointment.service_name}\n📅 *Data solicitada:* ${new Date(appointment.scheduled_date).toLocaleString('pt-BR')}\n\nInfelizmente não foi possível confirmar este agendamento. Por favor, entre em contato para mais informações.`,
        sender_name: 'Sistema'
      });

      if (msgError) {
        console.error('Erro ao enviar mensagem de rejeição:', msgError);
      }
    }

    toast({
      title: "Recusado",
      description: "Agendamento recusado e cliente notificado.",
    });
    loadAppointments();
  };

  const suggestDateChange = async (appointmentId: string) => {
    if (!newProposedDate || !newProposedTime) {
      toast({
        title: "Erro",
        description: "Por favor, selecione data e hora",
        variant: "destructive",
      });
      return;
    }

    const appointment = appointments.find(a => a.id === appointmentId);
    if (!appointment) return;

    const proposedDateTime = new Date(`${newProposedDate}T${newProposedTime}`);

    const { error } = await supabase
      .from('agent_appointments')
      .update({ 
        proposed_date: proposedDateTime.toISOString(),
        response_type: 'date_change',
        status: 'pending'
      })
      .eq('id', appointmentId);

    if (error) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    // Send date change suggestion to customer
    if (appointment.conversation_id) {
      const { error: msgError } = await supabase.from('agent_messages').insert({
        conversation_id: appointment.conversation_id,
        role: 'agent',
        content: `🔄 *Mudança de Data Sugerida*\n\n👤 *Cliente:* ${appointment.agent_customers.name}\n📋 *Serviço:* ${appointment.service_name}\n📅 *Data original:* ${new Date(appointment.scheduled_date).toLocaleString('pt-BR')}\n📅 *Nova data sugerida:* ${proposedDateTime.toLocaleString('pt-BR')}\n\n⚠️ A data solicitada não está disponível. Podemos agendar para a nova data sugerida?\n\nResponda "aceitar" para confirmar ou "recusar" se não puder nesta data.`,
        sender_name: 'Sistema'
      });

      if (msgError) {
        console.error('Erro ao enviar sugestão de data:', msgError);
      }
    }

    setDateChangeDialog({ open: false, appointmentId: null });
    setNewProposedDate("");
    setNewProposedTime("");
    
    toast({
      title: "Sugestão enviada!",
      description: "Cliente notificado sobre a mudança de data.",
    });
    loadAppointments();
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending_approval: "bg-orange-500",
      pending: "bg-yellow-500",
      confirmed: "bg-blue-500",
      cancelled: "bg-red-500",
      completed: "bg-green-500",
    };
    return colors[status] || "bg-gray-500";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending_approval: "Aguardando Aprovação",
      pending: "Aguardando Cliente",
      confirmed: "Confirmado",
      cancelled: "Cancelado",
      completed: "Concluído",
    };
    return labels[status] || status;
  };

  const deleteAppointment = async (appointmentId: string) => {
    if (!confirm('Tem certeza que deseja excluir este agendamento?')) return;

    const { error } = await supabase
      .from('agent_appointments')
      .delete()
      .eq('id', appointmentId);

    if (error) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Excluído!",
      description: "Agendamento excluído com sucesso.",
    });
    loadAppointments();
  };

  const openEditDialog = (appointment: Appointment) => {
    const date = new Date(appointment.scheduled_date);
    setEditDate(date.toISOString().split('T')[0]);
    setEditTime(date.toTimeString().slice(0, 5));
    setEditDialog({ open: true, appointment });
  };

  const saveEditAppointment = async () => {
    if (!editDialog.appointment || !editDate || !editTime) {
      toast({
        title: "Erro",
        description: "Por favor, preencha data e hora",
        variant: "destructive",
      });
      return;
    }

    const newDateTime = new Date(`${editDate}T${editTime}`);

    const { error } = await supabase
      .from('agent_appointments')
      .update({ scheduled_date: newDateTime.toISOString() })
      .eq('id', editDialog.appointment.id);

    if (error) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    // Send notification to customer
    if (editDialog.appointment.conversation_id) {
      const { error: msgError } = await supabase.from('agent_messages').insert({
        conversation_id: editDialog.appointment.conversation_id,
        role: 'agent',
        content: `ℹ️ *Agendamento Atualizado*\n\n👤 *Cliente:* ${editDialog.appointment.agent_customers.name}\n📋 *Serviço:* ${editDialog.appointment.service_name}\n📅 *Nova Data/Hora:* ${newDateTime.toLocaleString('pt-BR')}\n\nSeu agendamento foi atualizado.`,
        sender_name: 'Sistema'
      });

      if (msgError) {
        console.error('Erro ao enviar atualização:', msgError);
      }
    }

    setEditDialog({ open: false, appointment: null });
    setEditDate("");
    setEditTime("");
    
    toast({
      title: "Atualizado!",
      description: "Agendamento atualizado com sucesso.",
    });
    loadAppointments();
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

                  {(appointment.status === 'pending' || appointment.status === 'pending_approval') && (
                    <div className="flex flex-col gap-2 pt-2">
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => approveAppointment(appointment)}
                          className="flex-1"
                          variant="default"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Aceitar
                        </Button>
                        <Button 
                          onClick={() => rejectAppointment(appointment)}
                          className="flex-1"
                          variant="destructive"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Recusar
                        </Button>
                      </div>
                      <Button 
                        onClick={() => setDateChangeDialog({ open: true, appointmentId: appointment.id })}
                        variant="outline"
                        className="w-full"
                      >
                        <CalendarClock className="w-4 h-4 mr-2" />
                        Sugerir Nova Data
                      </Button>
                    </div>
                  )}

                  <div className="flex gap-2 mt-2">
                    <Button 
                      onClick={() => openEditDialog(appointment)}
                      variant="outline"
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                    <Button 
                      onClick={() => deleteAppointment(appointment.id)}
                      variant="outline"
                      className="flex-1"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Excluir
                    </Button>
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

      <Dialog open={dateChangeDialog.open} onOpenChange={(open) => setDateChangeDialog({ ...dateChangeDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sugerir Nova Data</DialogTitle>
            <DialogDescription>
              Selecione uma nova data e hora disponível para este agendamento.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-date">Nova Data</Label>
              <Input
                id="new-date"
                type="date"
                value={newProposedDate}
                onChange={(e) => setNewProposedDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-time">Novo Horário</Label>
              <Input
                id="new-time"
                type="time"
                value={newProposedTime}
                onChange={(e) => setNewProposedTime(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDateChangeDialog({ open: false, appointmentId: null })}>
              Cancelar
            </Button>
            <Button onClick={() => dateChangeDialog.appointmentId && suggestDateChange(dateChangeDialog.appointmentId)}>
              Enviar Sugestão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog({ ...editDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Agendamento</DialogTitle>
            <DialogDescription>
              Altere a data e hora do agendamento.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-date">Data</Label>
              <Input
                id="edit-date"
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-time">Horário</Label>
              <Input
                id="edit-time"
                type="time"
                value={editTime}
                onChange={(e) => setEditTime(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog({ open: false, appointment: null })}>
              Cancelar
            </Button>
            <Button onClick={saveEditAppointment}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}