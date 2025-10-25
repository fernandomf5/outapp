import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "lucide-react";
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

  if (loading) {
    return <div className="flex items-center justify-center p-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Calendar className="h-5 w-5" />
        Agendamentos
      </h3>
      <div className="grid gap-4">
        {appointments.map((appointment) => (
          <Card key={appointment.id} className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">{appointment.customer?.name}</h4>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  appointment.status === 'confirmed' ? 'bg-success/10 text-success' :
                  appointment.status === 'cancelled' ? 'bg-destructive/10 text-destructive' :
                  'bg-warning/10 text-warning'
                }`}>
                  {appointment.status}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {new Date(appointment.date).toLocaleString('pt-BR')}
              </p>
              {appointment.notes && (
                <p className="text-sm">{appointment.notes}</p>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};