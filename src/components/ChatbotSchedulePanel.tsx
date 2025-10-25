import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Clock, Plus } from "lucide-react";

export const ChatbotSchedulePanel = ({ chatbotId }: { chatbotId: string }) => {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const daysOfWeek = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  useEffect(() => {
    loadSchedules();
  }, [chatbotId]);

  const loadSchedules = async () => {
    try {
      const { data, error } = await supabase
        .from('chatbot_schedules')
        .select('*')
        .eq('chatbot_id', chatbotId)
        .order('day_of_week');

      if (error) throw error;
      setSchedules(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading schedules:', error);
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
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Horários de Atendimento
        </h3>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Horário
        </Button>
      </div>
      <div className="grid gap-4">
        {schedules.map((schedule) => (
          <Card key={schedule.id} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">{daysOfWeek[schedule.day_of_week]}</h4>
                <p className="text-sm text-muted-foreground">
                  {schedule.start_time} - {schedule.end_time}
                </p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${
                schedule.is_active ? 'bg-success/10 text-success' : 'bg-muted'
              }`}>
                {schedule.is_active ? 'Ativo' : 'Inativo'}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};