import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Send, LogOut, Calendar, ShoppingBag, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import AgentAppointmentDialog from "@/components/AgentAppointmentDialog";
import AgentOrderDialog from "@/components/AgentOrderDialog";

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
  const [showAppointmentDialog, setShowAppointmentDialog] = useState(false);
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [hasServices, setHasServices] = useState(false);
  const [hasProducts, setHasProducts] = useState(false);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [showAppointments, setShowAppointments] = useState(false);
  const [showOrders, setShowOrders] = useState(false);

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

  // Check if agent has services and products
  useEffect(() => {
    if (!agentId) return;

    const checkServicesAndProducts = async () => {
      const { data: services } = await supabase
        .from('agent_services')
        .select('id')
        .eq('agent_id', agentId)
        .eq('is_active', true)
        .limit(1);

      const { data: products } = await supabase
        .from('agent_products')
        .select('id')
        .eq('agent_id', agentId)
        .eq('is_available', true)
        .limit(1);

      setHasServices(services && services.length > 0);
      setHasProducts(products && products.length > 0);
    };

    checkServicesAndProducts();
  }, [agentId]);

  // Fetch customer appointments and orders
  useEffect(() => {
    if (!customer?.id || !agentId) return;

    const fetchCustomerData = async () => {
      const { data: appointmentsData } = await supabase
        .from('agent_appointments')
        .select('*')
        .eq('agent_id', agentId)
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false });

      const { data: ordersData } = await supabase
        .from('agent_orders')
        .select('*')
        .eq('agent_id', agentId)
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false });

      setAppointments(appointmentsData || []);
      setOrders(ordersData || []);
    };

    fetchCustomerData();

    // Real-time subscriptions for appointments and orders
    const appointmentsChannel = supabase
      .channel(`customer-appointments-${customer.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agent_appointments',
          filter: `customer_id=eq.${customer.id}`,
        },
        () => {
          fetchCustomerData();
        }
      )
      .subscribe();

    const ordersChannel = supabase
      .channel(`customer-orders-${customer.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agent_orders',
          filter: `customer_id=eq.${customer.id}`,
        },
        () => {
          fetchCustomerData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(appointmentsChannel);
      supabase.removeChannel(ordersChannel);
    };
  }, [customer?.id, agentId]);

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
    console.log('Configurando realtime para conversation_id:', conversationId);
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
          console.log('Nova mensagem recebida via realtime:', payload);
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

      // AI response will arrive via realtime subscription - no need to add manually
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

          <div className="p-4 border-t space-y-2">
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowAppointmentDialog(true)}
                disabled={!hasServices}
                title={!hasServices ? "Nenhum serviço disponível" : ""}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Agendar
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowOrderDialog(true)}
                disabled={!hasProducts}
                title={!hasProducts ? "Nenhum produto disponível" : ""}
              >
                <ShoppingBag className="w-4 h-4 mr-2" />
                Fazer Pedido
              </Button>
            </div>

            {/* Meus Agendamentos */}
            {appointments.length > 0 && (
              <Collapsible open={showAppointments} onOpenChange={setShowAppointments}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between">
                    <span className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Meus Agendamentos
                      <Badge variant="secondary">{appointments.length}</Badge>
                    </span>
                    {showAppointments ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 mt-2">
                  {appointments.map((appointment) => (
                    <Card key={appointment.id} className="p-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium">{appointment.service_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(appointment.scheduled_date).toLocaleString('pt-BR')}
                          </p>
                          {appointment.service_description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {appointment.service_description}
                            </p>
                          )}
                        </div>
                        <Badge 
                          variant={
                            appointment.status === 'confirmed' ? 'default' : 
                            appointment.status === 'rejected' ? 'destructive' : 
                            'secondary'
                          }
                        >
                          {appointment.status === 'pending' && 'Pendente'}
                          {appointment.status === 'confirmed' && 'Confirmado'}
                          {appointment.status === 'rejected' && 'Recusado'}
                          {appointment.status === 'rescheduled' && 'Reagendado'}
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Meus Pedidos */}
            {orders.length > 0 && (
              <Collapsible open={showOrders} onOpenChange={setShowOrders}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between">
                    <span className="flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4" />
                      Meus Pedidos
                      <Badge variant="secondary">{orders.length}</Badge>
                    </span>
                    {showOrders ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 mt-2">
                  {orders.map((order) => (
                    <Card key={order.id} className="p-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium">Pedido #{order.order_number}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(order.created_at).toLocaleString('pt-BR')}
                          </p>
                          <p className="text-sm font-medium mt-1">
                            Total: R$ {Number(order.total_amount).toFixed(2)}
                          </p>
                          {order.delivery_address && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Entrega: {order.delivery_address}
                            </p>
                          )}
                        </div>
                        <Badge 
                          variant={
                            order.status === 'confirmed' ? 'default' : 
                            order.status === 'delivered' ? 'default' :
                            order.status === 'cancelled' ? 'destructive' : 
                            'secondary'
                          }
                        >
                          {order.status === 'pending' && 'Pendente'}
                          {order.status === 'confirmed' && 'Confirmado'}
                          {order.status === 'preparing' && 'Preparando'}
                          {order.status === 'shipped' && 'Enviado'}
                          {order.status === 'delivered' && 'Entregue'}
                          {order.status === 'cancelled' && 'Cancelado'}
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )}

            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !loading && input.trim()) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Digite sua mensagem..."
                disabled={loading}
              />
              <Button onClick={handleSendMessage} disabled={loading || !input.trim()}>
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </Card>

        {customer && conversationId && (
          <>
            <AgentAppointmentDialog
              open={showAppointmentDialog}
              onOpenChange={setShowAppointmentDialog}
              agentId={agentId!}
              customerId={customer.id}
              conversationId={conversationId}
              onSuccess={() => {}}
            />
            <AgentOrderDialog
              open={showOrderDialog}
              onOpenChange={setShowOrderDialog}
              agentId={agentId!}
              customerId={customer.id}
              conversationId={conversationId}
              onSuccess={() => {}}
            />
          </>
        )}
      </div>
    </div>
  );
}