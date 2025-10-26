import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Clock, User, Phone, Mail, Printer, MapPin, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export const ChatbotAppointmentsPanel = ({ chatbotId }: { chatbotId: string }) => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAppointments();
  }, [chatbotId]);

  const loadAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from('chatbot_appointments')
        .select('*, customer:chatbot_customers(*)')
        .eq('chatbot_id', chatbotId)
        .order('date', { ascending: false });

      if (error) throw error;
      setAppointments(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading appointments:', error);
      setLoading(false);
    }
  };

  const printAppointment = (appointment: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Agendamento #${appointment.id.substring(0, 8)}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
            h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
            .section { margin: 20px 0; }
            .label { font-weight: bold; color: #666; }
            .value { margin-left: 10px; }
            .status { display: inline-block; padding: 5px 15px; border-radius: 20px; font-weight: bold; }
            .status-confirmed { background: #22c55e; color: white; }
            .status-pending { background: #eab308; color: white; }
            .status-cancelled { background: #ef4444; color: white; }
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
            <p class="info-row"><span class="label">Status:</span> <span class="status status-${appointment.status}">${appointment.status === 'confirmed' ? 'Confirmado' : appointment.status === 'cancelled' ? 'Cancelado' : 'Pendente'}</span></p>
          </div>

          <div class="section">
            <h2>📆 Data e Hora</h2>
            <p class="info-row"><span class="label">Data:</span><span class="value">${new Date(appointment.date).toLocaleDateString('pt-BR')}</span></p>
            <p class="info-row"><span class="label">Hora:</span><span class="value">${new Date(appointment.date).toLocaleTimeString('pt-BR')}</span></p>
          </div>

          <div class="section">
            <h2>👤 Dados do Cliente</h2>
            <p class="info-row"><span class="label">Nome:</span><span class="value">${appointment.customer?.name || 'N/A'}</span></p>
            <p class="info-row"><span class="label">Email:</span><span class="value">${appointment.customer?.email || 'N/A'}</span></p>
            <p class="info-row"><span class="label">Telefone:</span><span class="value">${appointment.customer?.phone || 'N/A'}</span></p>
          </div>

          ${appointment.notes ? `
          <div class="section">
            <h2>📝 Observações</h2>
            <div class="notes">${appointment.notes}</div>
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
    return <div className="flex items-center justify-center p-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold flex items-center gap-2">
          <Calendar className="h-6 w-6" />
          Agendamentos
        </h3>
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
                    <CardTitle className="text-lg">Agendamento #{appointment.id.substring(0, 8)}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(appointment.created_at), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                  <Badge className={
                    appointment.status === 'confirmed' ? 'bg-green-500' :
                    appointment.status === 'cancelled' ? 'bg-red-500' :
                    'bg-yellow-500'
                  }>
                    {appointment.status === 'confirmed' ? 'Confirmado' : 
                     appointment.status === 'cancelled' ? 'Cancelado' : 'Pendente'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">Data:</span>
                      <span>{new Date(appointment.date).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">Hora:</span>
                      <span>{new Date(appointment.date).toLocaleTimeString('pt-BR')}</span>
                    </div>
                  </div>

                  <div className="border-t pt-3">
                    <h4 className="font-semibold mb-2">Dados do Cliente</h4>
                    <div className="grid gap-2">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">Nome:</span>
                        <span>{appointment.customer?.name || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">Email:</span>
                        <span>{appointment.customer?.email || 'N/A'}</span>
                      </div>
                      {appointment.customer?.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">Telefone:</span>
                          <span>{appointment.customer.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {appointment.notes && (
                    <div className="border-t pt-3">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <h4 className="font-semibold">Observações</h4>
                      </div>
                      <div className="bg-muted p-3 rounded-lg">
                        <p className="text-sm">{appointment.notes}</p>
                      </div>
                    </div>
                  )}

                  <Button 
                    onClick={() => printAppointment(appointment)}
                    variant="outline"
                    className="w-full mt-4"
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
};