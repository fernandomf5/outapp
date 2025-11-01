import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Service {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
}

interface ChatbotAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chatbotId: string;
  customerId: string;
  conversationId: string;
  onSuccess: () => void;
}

export default function ChatbotAppointmentDialog({
  open,
  onOpenChange,
  chatbotId,
  customerId,
  conversationId,
  onSuccess,
}: ChatbotAppointmentDialogProps) {
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [customerName, setCustomerName] = useState("");

  useEffect(() => {
    if (open) {
      loadServices();
      loadCustomerName();
    }
  }, [open, chatbotId, customerId]);

  const loadCustomerName = async () => {
    const { data } = await supabase
      .from('chatbot_customers')
      .select('name')
      .eq('id', customerId)
      .single();
    
    if (data) {
      setCustomerName(data.name);
    }
  };

  const loadServices = async () => {
    const { data, error } = await supabase
      .from('chatbot_services')
      .select('*')
      .eq('chatbot_id', chatbotId)
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

  const handleSubmit = async () => {
    if (!selectedService || !selectedDate) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione serviço e data",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('chatbot_appointments')
        .insert({
          chatbot_id: chatbotId,
          customer_id: customerId,
          date: selectedDate.toISOString(),
          notes: notes || null,
          status: 'pending',
        });

      if (error) throw error;

      // Send message to chat
      if (conversationId) {
        await supabase.from('chatbot_messages').insert({
          conversation_id: conversationId,
          role: 'user',
          content: `📅 *Novo Agendamento Solicitado*\n\n👤 *Cliente:* ${customerName}\n📋 *Serviço:* ${selectedService.name}\n💰 *Preço:* R$ ${selectedService.price}\n⏱️ *Duração:* ${selectedService.duration_minutes} minutos\n📅 *Data:* ${format(selectedDate, "PPP 'às' HH:mm", { locale: ptBR })}${notes ? `\n\n📝 *Observações:* ${notes}` : ''}\n\n⏳ Aguardando confirmação...`,
          sender_name: customerName
        });
      }

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
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agendar Serviço</DialogTitle>
          <DialogDescription>
            Selecione o serviço e data desejados
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {customerName && (
            <div>
              <Label>Nome do Cliente</Label>
              <div className="p-3 border rounded-md bg-muted">
                <p className="font-medium">{customerName}</p>
              </div>
            </div>
          )}

          <div>
            <Label>Serviço *</Label>
            <select
              value={selectedService?.id || ''}
              onChange={(e) => {
                const service = services.find(s => s.id === e.target.value);
                setSelectedService(service || null);
              }}
              className="w-full p-2 border rounded-md"
            >
              <option value="">Selecione um serviço</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name} - {service.duration_minutes} min - R$ {service.price.toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          {selectedService && (
            <div>
              <Label>Data e Hora *</Label>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  return date < today;
                }}
                locale={ptBR}
                className="p-3 rounded-md border"
              />
            </div>
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
            disabled={loading || !selectedService || !selectedDate}
            className="w-full"
          >
            {loading ? "Enviando..." : "Confirmar Agendamento"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
