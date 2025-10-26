import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

interface Service {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
}

interface AgentAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentId: string;
  customerId: string;
  conversationId: string;
  onSuccess: () => void;
}

export default function AgentAppointmentDialog({
  open,
  onOpenChange,
  agentId,
  customerId,
  conversationId,
  onSuccess,
}: AgentAppointmentDialogProps) {
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  const [pastTimes, setPastTimes] = useState<string[]>([]);
  const [blockedDates, setBlockedDates] = useState<Date[]>([]);

  useEffect(() => {
    if (open) {
      loadServices();
      loadBlockedDates();
    }
  }, [open, agentId]);

  useEffect(() => {
    if (selectedDate && selectedService) {
      loadAvailableTimes();
    }
  }, [selectedDate, selectedService]);

  const loadServices = async () => {
    const { data, error } = await supabase
      .from('agent_services')
      .select('*')
      .eq('agent_id', agentId)
      .eq('is_active', true)
      .order('name');

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar serviços",
        variant: "destructive",
      });
    } else {
      setServices(data || []);
      if (!data || data.length === 0) {
        toast({
          title: "Aviso",
          description: "Nenhum serviço disponível para agendamento",
          variant: "destructive",
        });
      }
    }
  };

  const loadBlockedDates = async () => {
    const { data } = await supabase
      .from('agent_schedule_blocks')
      .select('start_date, end_date')
      .eq('agent_id', agentId);

    if (data) {
      const blocked: Date[] = [];
      data.forEach(block => {
        const start = new Date(block.start_date);
        const end = new Date(block.end_date);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          blocked.push(new Date(d));
        }
      });
      setBlockedDates(blocked);
    }
  };

  const loadAvailableTimes = async () => {
    if (!selectedDate) return;

    const dayOfWeek = selectedDate.getDay();
    
    // Buscar horário de funcionamento
    const { data: schedule, error: scheduleError } = await supabase
      .from('agent_schedule')
      .select('start_time, end_time')
      .eq('agent_id', agentId)
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true)
      .maybeSingle();

    if (scheduleError || !schedule) {
      setAvailableTimes([]);
      setPastTimes([]);
      toast({
        title: "Horário não configurado",
        description: "Este dia não possui horário de funcionamento configurado. Configure em Gestão > Horários.",
        variant: "destructive",
      });
      return;
    }

    // Buscar agendamentos já existentes para o dia
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const { data: appointments } = await supabase
      .from('agent_appointments')
      .select('scheduled_date')
      .eq('agent_id', agentId)
      .gte('scheduled_date', startOfDay.toISOString())
      .lte('scheduled_date', endOfDay.toISOString())
      .in('status', ['pending', 'pending_approval', 'confirmed']);

    const bookedTimesList = (appointments || []).map(apt => 
      format(new Date(apt.scheduled_date), 'HH:mm')
    );
    setBookedTimes(bookedTimesList);

    // Gerar horários disponíveis e passados
    const times: string[] = [];
    const pastTimesList: string[] = [];
    const [startHour, startMinute] = schedule.start_time.split(':').map(Number);
    const [endHour, endMinute] = schedule.end_time.split(':').map(Number);
    
    const now = new Date();
    const isToday = selectedDate.toDateString() === now.toDateString();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    for (let h = startHour; h <= endHour; h++) {
      for (let m = 0; m < 60; m += 30) {
        if (h === endHour && m > endMinute) break;
        if (h === startHour && m < startMinute) continue;
        
        const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        
        // Se for hoje, separar horários passados
        if (isToday && (h < currentHour || (h === currentHour && m <= currentMinute))) {
          pastTimesList.push(timeStr);
        } else {
          times.push(timeStr);
        }
      }
    }
    
    setAvailableTimes(times);
    setPastTimes(pastTimesList);
  };

  const handleSubmit = async () => {
    if (!selectedService || !selectedDate || !selectedTime) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione serviço, data e horário",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const [hours, minutes] = selectedTime.split(':');
      const scheduledDate = new Date(selectedDate);
      scheduledDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const payload: any = {
        agent_id: agentId,
        customer_id: customerId,
        service_id: selectedService.id,
        service_name: selectedService.name,
        service_description: selectedService.description,
        scheduled_date: scheduledDate.toISOString(),
        customer_notes: notes,
        status: 'pending',
      };
      if (conversationId) {
        payload.conversation_id = conversationId;
      }

      const { error } = await supabase
        .from('agent_appointments')
        .insert(payload);

      if (error) {
        console.error('Erro ao criar agendamento:', error);
        throw error;
      }

      // Enviar mensagem ao chat quando o agendamento é criado
      if (conversationId) {
        await supabase.from('agent_messages').insert({
          conversation_id: conversationId,
          role: 'customer',
          content: `📅 *Novo Agendamento Solicitado*\n\n📋 *Serviço:* ${selectedService.name}\n💰 *Preço:* R$ ${selectedService.price}\n⏱️ *Duração:* ${selectedService.duration_minutes} minutos\n📅 *Data/Hora:* ${scheduledDate.toLocaleString('pt-BR')}${notes ? `\n\n📝 *Observações:* ${notes}` : ''}\n\n⏳ Aguardando confirmação...`,
          sender_name: 'Sistema'
        });
      }

      // Criar notificação
      await supabase.from('agent_notifications').insert({
        agent_id: agentId,
        notification_type: 'new_appointment',
        title: 'Novo Agendamento',
        message: `Solicitação de agendamento para ${selectedService.name}`,
        is_read: false,
      });

      toast({
        title: "Agendamento solicitado! 📅",
        description: "Aguarde a confirmação",
      });

      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedService(null);
    setSelectedDate(undefined);
    setSelectedTime("");
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agendar Serviço</DialogTitle>
          <DialogDescription>
            Selecione o serviço, data e horário desejados
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Serviço *</Label>
            <Select
              value={selectedService?.id}
              onValueChange={(id) => {
                const service = services.find(s => s.id === id);
                setSelectedService(service || null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um serviço" />
              </SelectTrigger>
              <SelectContent>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    <div className="flex flex-col">
                      <span>{service.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {service.duration_minutes} min - R$ {service.price.toFixed(2)}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedService && (
            <>
              <div>
                <Label>Data *</Label>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    if (date < today) return true;
                    
                    return blockedDates.some(blocked => 
                      blocked.toDateString() === date.toDateString()
                    );
                  }}
                  locale={ptBR}
                  className="p-3 pointer-events-auto rounded-md border"
                />
              </div>

              {selectedDate && (pastTimes.length > 0 || availableTimes.length > 0) && (
                <div>
                  <Label>Horário * (selecione um horário disponível)</Label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {pastTimes.map((time) => (
                      <Button
                        key={time}
                        variant="outline"
                        size="sm"
                        disabled
                        className="bg-destructive/10 text-destructive border-destructive/20 cursor-not-allowed hover:bg-destructive/10"
                      >
                        {time}
                      </Button>
                    ))}
                    {availableTimes.map((time) => {
                      const isBooked = bookedTimes.includes(time);
                      return (
                        <Button
                          key={time}
                          variant={selectedTime === time ? "default" : "outline"}
                          size="sm"
                          onClick={() => !isBooked && setSelectedTime(time)}
                          disabled={isBooked}
                          className="relative"
                        >
                          {time}
                          {isBooked && (
                            <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 text-[10px]">
                              X
                            </Badge>
                          )}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Informações adicionais sobre o agendamento"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={loading || !selectedService || !selectedDate || !selectedTime}
            className="w-full"
          >
            {loading ? "Enviando..." : "Confirmar Agendamento"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}