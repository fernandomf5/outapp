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
    setupRealtimeSubscription();
  }, [agentId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadAgentAndConversation = async (customerId: string) => {
    // Load agent info
    const { data: agent } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('id', agentId)
      .single();

    setAgentInfo(agent);

    // Load or create conversation
    const { data: existingConv } = await supabase
      .from('agent_conversations')
      .select('*')
      .eq('agent_id', agentId)
      .eq('customer_id', customerId)
      .eq('status', 'active')
      .single();

    if (existingConv) {
      setConversationId(existingConv.id);
      loadMessages(existingConv.id);
    } else {
      const { data: newConv } = await supabase
        .from('agent_conversations')
        .insert({
          agent_id: agentId,
          customer_id: customerId,
        })
        .select()
        .single();

      setConversationId(newConv.id);
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
          setMessages((prev) => [...prev, payload.new as Message]);
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
    const userMessage = input;
    setInput("");

    try {
      // Save user message
      await supabase.from('agent_messages').insert({
        conversation_id: conversationId,
        role: 'customer',
        content: userMessage,
      });

      // Process with AI
      const { data, error } = await supabase.functions.invoke('process-agent-customer-message', {
        body: {
          agentId,
          customerId: customer.id,
          conversationId,
          message: userMessage,
        }
      });

      if (error) throw error;

      // Save agent response
      await supabase.from('agent_messages').insert({
        conversation_id: conversationId,
        role: 'agent',
        content: data.response,
      });

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
                  className={`flex ${message.role === 'customer' ? 'justify-end' : 'justify-start'}`}
                >
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