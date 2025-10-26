import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Send, LogOut, Calendar, ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Message {
  id: string;
  role: 'customer' | 'agent';
  content: string;
  created_at: string;
  sender_name?: string;
}

export default function AgentCustomerChat() {
  const { agentId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [agentInfo, setAgentInfo] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check authentication
    const customerData = localStorage.getItem(`agent_customer_${agentId}`);
    if (!customerData) {
      navigate(`/agent-auth/${agentId}`);
      return;
    }

    const parsedCustomer = JSON.parse(customerData);
    setCustomer(parsedCustomer);

    loadAgentAndConversation(parsedCustomer.id);
  }, [agentId]);

  useEffect(() => {
    if (conversationId) {
      const cleanup = setupRealtimeSubscription();
      return cleanup;
    }
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadAgentAndConversation = async (customerId: string) => {
    try {
      // Load agent info
      const { data: agent } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('id', agentId)
        .single();

      setAgentInfo(agent);

      // Load all conversations for this customer
      const { data: conversations } = await supabase
        .from('agent_conversations')
        .select('*')
        .eq('agent_id', agentId)
        .eq('customer_id', customerId)
        .order('last_message_at', { ascending: false });

      // Get active conversation or create new one
      let activeConv = conversations?.find(c => c.status === 'active');

      if (activeConv) {
        setConversationId(activeConv.id);
        await loadMessages(activeConv.id);
      } else {
        // Create new conversation with last_message_at
        const { data: newConv } = await supabase
          .from('agent_conversations')
          .insert({
            agent_id: agentId,
            customer_id: customerId,
            status: 'active',
            last_message_at: new Date().toISOString(),
          })
          .select()
          .single();

        setConversationId(newConv.id);

        // Create notification for new conversation
        await supabase
          .from('agent_notifications')
          .insert({
            agent_id: agentId,
            notification_type: 'new_conversation',
            title: 'Nova Conversa',
            message: `${customer?.name || 'Cliente'} iniciou uma conversa`,
            is_read: false,
          });
      }
    } catch (error) {
      console.error('Error loading agent:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o agente",
        variant: "destructive",
      });
    }
  };

  const loadMessages = async (convId: string) => {
    const { data } = await supabase
      .from('agent_messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });

    setMessages((data || []) as Message[]);
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('agent-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => [...prev, newMessage]);
          
          // Show toast for status updates
          if (newMessage.content.includes('Aprovado') || newMessage.content.includes('Confirmado')) {
            toast({
              title: "✅ Aprovado!",
              description: "Seu agendamento foi confirmado",
            });
          } else if (newMessage.content.includes('Recusado')) {
            toast({
              title: "❌ Recusado",
              description: "Agendamento não pôde ser confirmado",
              variant: "destructive",
            });
          } else if (newMessage.content.includes('Mudança de Data')) {
            toast({
              title: "🔄 Nova Data Sugerida",
              description: "Uma nova data foi sugerida para seu agendamento",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !conversationId || !customer) return;

    setLoading(true);
    const userMessage = input.trim().toLowerCase();
    const originalInput = input;
    setInput("");

    // Check if user is responding to a date change suggestion
    if (userMessage === 'aceitar' || userMessage === 'recusar') {
      try {
        // Find pending appointment with date change
        const { data: pendingAppointments } = await supabase
          .from('agent_appointments')
          .select('*')
          .eq('conversation_id', conversationId)
          .eq('response_type', 'date_change')
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1);

        if (pendingAppointments && pendingAppointments.length > 0) {
          const appointment = pendingAppointments[0];
          
          if (userMessage === 'aceitar') {
            // Accept the date change
            await supabase
              .from('agent_appointments')
              .update({ 
                scheduled_date: appointment.proposed_date,
                status: 'confirmed',
                response_type: 'approved'
              })
              .eq('id', appointment.id);

            await supabase.from('agent_messages').insert({
              conversation_id: conversationId,
              role: 'assistant',
              content: `✅ *Data Confirmada!*\n\n📋 *Serviço:* ${appointment.service_name}\n📅 *Nova Data/Hora:* ${new Date(appointment.proposed_date!).toLocaleString('pt-BR')}\n\nAgendamento confirmado com sucesso!`,
              sender_name: 'Sistema'
            });

            toast({
              title: "✅ Confirmado!",
              description: "Nova data aceita com sucesso",
            });
          } else {
            // Reject the date change
            await supabase
              .from('agent_appointments')
              .update({ 
                status: 'cancelled',
                response_type: 'rejected'
              })
              .eq('id', appointment.id);

            await supabase.from('agent_messages').insert({
              conversation_id: conversationId,
              role: 'assistant',
              content: `❌ *Data Recusada*\n\nVocê recusou a nova data sugerida. Por favor, entre em contato para agendar em outra data.`,
              sender_name: 'Sistema'
            });

            toast({
              title: "❌ Recusado",
              description: "Data recusada",
            });
          }

          setLoading(false);
          return;
        }
      } catch (error: any) {
        toast({
          title: "Erro",
          description: error.message,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
    }

    try {
      // Save user message
      await supabase.from('agent_messages').insert({
        conversation_id: conversationId,
        role: 'customer',
        content: originalInput,
      });

      await supabase
        .from('agent_conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

      // Process with AI
      const { data, error } = await supabase.functions.invoke('process-agent-customer-message', {
        body: {
          agentId,
          customerId: customer.id,
          conversationId,
          message: originalInput,
        }
      });

      if (error) throw error;

      // Save agent response
      await supabase.from('agent_messages').insert({
        conversation_id: conversationId,
        role: 'agent',
        content: data.response,
      });

      await supabase
        .from('agent_conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

      // Show notifications for appointments/orders
      if (data.appointment) {
        toast({
          title: "Agendamento criado! 📅",
          description: `${data.appointment.service_name} - ${new Date(data.appointment.scheduled_date).toLocaleString()}`,
        });
      }

      if (data.order) {
        toast({
          title: "Pedido criado! 🛍️",
          description: `Pedido #${data.order.order_number} - R$ ${data.order.total_amount}`,
        });
      }
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

  const handleLogout = () => {
    localStorage.removeItem(`agent_customer_${agentId}`);
    navigate(`/agent-auth/${agentId}`);
  };

  return (
    <div className="min-h-screen gradient-primary">
      <div className="container mx-auto max-w-4xl h-screen flex flex-col p-4">
        <Card className="flex-1 flex flex-col">
          <div className="p-4 border-b flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">{agentInfo?.name || 'Atendimento'}</h2>
              <p className="text-sm text-muted-foreground">Olá, {customer?.name}!</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex flex-col ${message.role === 'customer' ? 'items-end' : 'items-start'}`}
                >
                  <span className="text-xs text-muted-foreground mb-1 px-1">
                    {message.role === 'customer' ? customer?.name : (message.sender_name || agentInfo?.name)}
                  </span>
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === 'customer'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <span className="text-xs opacity-70 mt-1 block">
                      {new Date(message.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Digite sua mensagem..."
                disabled={loading}
              />
              <Button onClick={handleSendMessage} disabled={loading || !input.trim()}>
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}