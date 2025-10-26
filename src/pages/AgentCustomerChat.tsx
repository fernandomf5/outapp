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
  const sentMessagesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Verifica o tipo de acesso do agente
        const { data: agent } = await supabase
          .from('ai_agents')
          .select('access_type')
          .eq('id', agentId)
          .single();

        // Verificar se tem dados no localStorage
        const customerData = localStorage.getItem(`agent_customer_${agentId}`);
        
        if (customerData) {
          try {
            const parsedCustomer = JSON.parse(customerData);
            setCustomer(parsedCustomer);
            loadAgentAndConversation(parsedCustomer.id, parsedCustomer.name);
            return;
          } catch (error) {
            console.error('Error parsing customer data:', error);
            localStorage.removeItem(`agent_customer_${agentId}`);
          }
        }

        // Se não tem dados no localStorage
        if (agent?.access_type === 'anonymous') {
          // Acesso anônimo - criar sessão temporária
          const tempCustomer = {
            id: crypto.randomUUID(),
            name: 'Visitante',
            email: `anon_${Date.now()}@temp.com`,
          };
          setCustomer(tempCustomer);
          localStorage.setItem(`agent_customer_${agentId}`, JSON.stringify(tempCustomer));
          loadAgentAndConversation(tempCustomer.id, tempCustomer.name);
          return;
        }

        // Redirecionar para autenticação
        navigate(`/agent-auth/${agentId}`, { replace: true });
      } catch (error) {
        console.error('Error checking auth:', error);
      }
    };

    checkAuth();
  }, [agentId, navigate]);

  useEffect(() => {
    if (conversationId) {
      const cleanup = setupRealtimeSubscription();
      return cleanup;
    }
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadAgentAndConversation = async (customerId: string, customerName?: string) => {
    try {
      // Chamar edge function para inicializar conversa (bypass RLS)
      const { data, error } = await supabase.functions.invoke('init-agent-conversation', {
        body: { agentId, customerId, customerName }
      });

      if (error) throw error;
      if (!data || data.error) {
        toast({
          title: "Agente indisponível",
          description: data?.error || "Este agente não existe ou está inativo.",
          variant: "destructive",
        });
        navigate(`/agent-auth/${agentId}`, { replace: true });
        return;
      }

      setAgentInfo(data.agent);
      setConversationId(data.conversationId);
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error loading agent:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o agente",
        variant: "destructive",
      });
    }
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
          const key = `${newMessage.role}:${newMessage.content}`;
          if (sentMessagesRef.current.has(key)) {
            // Prevent duplicate of optimistic message
            sentMessagesRef.current.delete(key);
            return;
          }
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
    const originalInput = input;
    setInput("");

    // Optimistic UI: show the customer's message immediately
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      role: 'customer',
      content: originalInput,
      created_at: new Date().toISOString(),
      sender_name: customer?.name,
    };
    const dupKey = `customer:${originalInput}`;
    sentMessagesRef.current.add(dupKey);
    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      // Process message via edge function (handles saving + AI response)
      const { data, error } = await supabase.functions.invoke('process-agent-customer-message', {
        body: {
          agentId,
          customerId: customer.id,
          conversationId,
          message: originalInput,
        }
      });

      if (error) throw error;

      // Show notifications for appointments/orders
      if (data?.appointment) {
        toast({
          title: "Agendamento criado! 📅",
          description: `${data.appointment.service_name} - ${new Date(data.appointment.scheduled_date).toLocaleString()}`,
        });
      }

      if (data?.order) {
        toast({
          title: "Pedido criado! 🛍️",
          description: `Pedido #${data.order.order_number} - R$ ${data.order.total_amount}`,
        });
      }

      // If the function returned an AI message, append it (fallback if realtime is not active)
      if (data?.reply || data?.response || data?.message) {
        const aiContent = data.reply || data.response || data.message;
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            role: 'agent',
            content: aiContent,
            created_at: new Date().toISOString(),
            sender_name: agentInfo?.name,
          },
        ]);
      }
    } catch (error: any) {
      // Revert optimistic message on error
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      sentMessagesRef.current.delete(dupKey);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível enviar sua mensagem",
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
              {/* Mensagem de boas-vindas do agente (sempre visível) */}
              {agentInfo?.config?.welcomeMessage && (
                <div className="flex flex-col items-start">
                  <span className="text-xs text-muted-foreground mb-1 px-1">
                    {agentInfo?.name || 'Atendente'}
                  </span>
                  <div className="max-w-[80%] rounded-lg p-3 bg-muted">
                    <p className="whitespace-pre-wrap">{agentInfo.config.welcomeMessage}</p>
                  </div>
                </div>
              )}
              
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