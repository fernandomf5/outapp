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
import ChatbotAppointmentDialog from "@/components/ChatbotAppointmentDialog";
import ChatbotOrderDialog from "@/components/ChatbotOrderDialog";

interface Message {
  id: string;
  role: 'user' | 'bot' | 'assistant';
  content: string;
  created_at: string;
  sender_name?: string;
}

export default function ChatbotCustomerChat() {
  const { chatbotId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [chatbotInfo, setChatbotInfo] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
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
        // Verifica o tipo de acesso do chatbot
        const { data: chatbot } = await supabase
          .from('chatbots')
          .select('access_type')
          .eq('id', chatbotId)
          .single();

        // Verificar se tem dados no localStorage
        const customerData = localStorage.getItem(`chatbot_customer_${chatbotId}`);
        
        if (customerData) {
          try {
            const parsedCustomer = JSON.parse(customerData);
            setCustomer(parsedCustomer);
            loadChatbotAndConversation(parsedCustomer.id, parsedCustomer);
            return;
          } catch (error) {
            console.error('Error parsing customer data:', error);
            localStorage.removeItem(`chatbot_customer_${chatbotId}`);
          }
        }

        // Se não tem dados no localStorage
        if (chatbot?.access_type === 'anonymous') {
          // Acesso anônimo - criar sessão temporária
          const tempCustomer = {
            id: crypto.randomUUID(),
            name: 'Visitante',
            email: `anon_${Date.now()}@temp.com`,
          };
          setCustomer(tempCustomer);
          loadChatbotAndConversation(tempCustomer.id, tempCustomer);
          return;
        }

        // Redirecionar para autenticação
        navigate(`/chatbot-auth/${chatbotId}`, { replace: true });
      } catch (error) {
        console.error('Error checking auth:', error);
      }
    };

    checkAuth();
  }, [chatbotId, navigate]);

  useEffect(() => {
    if (conversationId) {
      const cleanup = setupRealtimeSubscription();
      return cleanup;
    }
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Check if chatbot has services and products
  useEffect(() => {
    if (!chatbotId) return;

    const checkServicesAndProducts = async () => {
      const { data: services } = await supabase
        .from('chatbot_services')
        .select('id')
        .eq('chatbot_id', chatbotId)
        .eq('is_active', true)
        .limit(1);

      const { data: products } = await supabase
        .from('chatbot_products')
        .select('id')
        .eq('chatbot_id', chatbotId)
        .eq('is_active', true)
        .eq('type', 'product')
        .limit(1);

      setHasServices(services && services.length > 0);
      setHasProducts(products && products.length > 0);
    };

    checkServicesAndProducts();
  }, [chatbotId]);

  // Fetch customer appointments and orders
  useEffect(() => {
    if (!customer?.id || !chatbotId) return;

    const fetchCustomerData = async () => {
      const { data: appointmentsData } = await supabase
        .from('chatbot_appointments')
        .select('*')
        .eq('chatbot_id', chatbotId)
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false });

      const { data: ordersData } = await supabase
        .from('chatbot_orders')
        .select('*')
        .eq('chatbot_id', chatbotId)
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false });

      setAppointments(appointmentsData || []);
      setOrders(ordersData || []);
    };

    fetchCustomerData();

    // Real-time subscriptions
    const appointmentsChannel = supabase
      .channel(`chatbot-customer-appointments-${customer.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chatbot_appointments',
          filter: `customer_id=eq.${customer.id}`,
        },
        () => fetchCustomerData()
      )
      .subscribe();

    const ordersChannel = supabase
      .channel(`chatbot-customer-orders-${customer.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chatbot_orders',
          filter: `customer_id=eq.${customer.id}`,
        },
        () => fetchCustomerData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(appointmentsChannel);
      supabase.removeChannel(ordersChannel);
    };
  }, [customer?.id, chatbotId]);

  const loadChatbotAndConversation = async (customerId: string, customerData?: any) => {
    try {
      // Load chatbot info
      const { data: chatbot } = await supabase
        .from('chatbots')
        .select('*')
        .eq('id', chatbotId)
        .single();

      setChatbotInfo(chatbot);

      // Search for existing conversation by customer email/phone
      const { data: conversations } = await supabase
        .from('chatbot_conversations')
        .select('*')
        .eq('chatbot_id', chatbotId)
        .or(`visitor_email.eq.${customerData?.email},visitor_phone.eq.${customerData?.phone}`)
        .order('last_message_at', { ascending: false });

      // Get active conversation or create new one
      let activeConv = conversations?.find(c => c.status === 'active');

      if (activeConv) {
        setConversationId(activeConv.id);
        // Verificar se já existem mensagens do fluxo; caso contrário, processar agora
        const { data: existingMsgs } = await supabase
          .from('chatbot_messages')
          .select('id, role, node_id')
          .eq('conversation_id', activeConv.id);
        const hasFlowMsgs = (existingMsgs || []).some((m: any) => m.role === 'bot' && m.node_id);
        if (!hasFlowMsgs) {
          await processInitialFlowMessages(chatbot, activeConv.id);
        }
        await loadMessages(activeConv.id);
      } else {
        // Process flow initial message
        await processInitialFlow(chatbot);
        
        // Create new conversation with unique session_id
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const { data: newConv } = await supabase
          .from('chatbot_conversations')
          .insert({
            chatbot_id: chatbotId,
            session_id: sessionId,
            visitor_email: customerData?.email || null,
            visitor_name: customerData?.name || null,
            visitor_phone: customerData?.phone || null,
            status: 'active',
            last_message_at: new Date().toISOString(),
          })
          .select()
          .single();

        setConversationId(newConv.id);
        
        // Process flow initial message after creating conversation
        await processInitialFlowMessages(chatbot, newConv.id);
        
        // Load messages after processing flow
        await loadMessages(newConv.id);

        // Create notification for new conversation
        await supabase
          .from('chatbot_notifications')
          .insert({
            chatbot_id: chatbotId,
            type: 'new_conversation',
            title: 'Nova Conversa',
            message: `${customerData?.name || 'Visitante'} iniciou uma conversa`,
            is_read: false,
          });
      }
    } catch (error) {
      console.error('Error loading chatbot:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o chatbot",
        variant: "destructive",
      });
    }
  };

  const loadMessages = async (convId: string) => {
    const { data } = await supabase
      .from('chatbot_messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });

    setMessages((data || []) as Message[]);
  };

  const replaceVars = (text: string) => {
    const fullName = customer?.name || 'Visitante';
    const firstName = String(fullName).split(' ')[0];
    return (text || '')
      .replace(/\{\{\s*name\s*\}\}|\{\s*name\s*\}/gi, fullName)
      .replace(/\{\{\s*first_name\s*\}\}|\{\s*first_name\s*\}/gi, firstName);
  };

  const processInitialFlowMessages = async (chatbot: any, convId: string) => {
    const nodes = chatbot?.config?.nodes || [];
    const edges = chatbot?.config?.edges || [];

    // Se não houver nenhum nó no fluxo, usar mensagem inicial
    if (!nodes.length) {
      const initial = chatbot?.config?.initialMessage;
      if (initial) {
        await supabase.from('chatbot_messages').insert({
          conversation_id: convId,
          role: 'bot',
          content: replaceVars(initial),
        });
      }
      return;
    }

    // Tentar iniciar pelo nó "trigger" se existir
    const triggerNode = nodes.find((n: any) => (n.type || '').toLowerCase() === 'trigger' || (n.type || '').toLowerCase() === 'triggernode');
    if (triggerNode) {
      const connectedEdges = edges.filter((e: any) => e.source === triggerNode.id);
      for (const edge of connectedEdges) {
        const targetNode = nodes.find((n: any) => n.id === edge.target);
        if (!targetNode) continue;

        await walkFromNode(targetNode, nodes, edges, convId);
      }
      return;
    }

    // Sem trigger: procurar nó inicial marcado ou sem arestas de entrada
    const hasIncoming = (nodeId: string) => edges.some((e: any) => e.target === nodeId);
    const startNodes = nodes.filter((n: any) => n?.data?.isInitial || !hasIncoming(n.id));

    if (startNodes.length) {
      for (const n of startNodes) {
        await walkFromNode(n, nodes, edges, convId);
      }
      return;
    }

    // Último fallback: mensagem inicial
    const initial = chatbot?.config?.initialMessage;
    if (initial) {
      await supabase.from('chatbot_messages').insert({
        conversation_id: convId,
        role: 'bot',
        content: replaceVars(initial),
      });
    }
    return;
  };

  // Helper para inserir conteúdo de um nó como mensagem
  const insertNodeAsMessage = async (node: any, convId: string) => {
    const type = (node.type || '').toLowerCase();
    let messageContent = '';
    let mediaUrl = '';
    let mediaType = '';

    if (type === 'textnode' || type === 'text') {
      messageContent = node.data?.text || node.data?.label || '';
    } else if (type === 'messagenode' || type === 'message') {
      messageContent = node.data?.message || node.data?.label || '';
    } else if (type === 'imagenode' || type === 'image') {
      mediaUrl = node.data?.imageUrl || '';
      mediaType = 'image';
      messageContent = node.data?.caption || 'Imagem';
    } else if (type === 'videonode' || type === 'video') {
      mediaUrl = node.data?.videoUrl || '';
      mediaType = 'video';
      messageContent = node.data?.caption || 'Vídeo';
    } else if (type === 'audionode' || type === 'audio') {
      mediaUrl = node.data?.audioUrl || '';
      mediaType = 'audio';
      messageContent = node.data?.caption || 'Áudio';
    } else if (type === 'documentnode' || type === 'document') {
      mediaUrl = node.data?.documentUrl || '';
      mediaType = 'document';
      messageContent = node.data?.caption || 'Documento';
    } else if (type === 'buttonnode' || type === 'button') {
      const buttons = node.data?.buttons || [];
      messageContent = node.data?.message || node.data?.label || '';
      if (buttons.length > 0) {
        messageContent += '\n\nOpções:\n' + buttons.map((b: any, i: number) => `${i + 1}. ${typeof b === 'string' ? b : (b?.text || '')}`).join('\n');
      }
    } else if (type === 'quickreplynode' || type === 'quickreply') {
      const replies = node.data?.quickReplies || node.data?.buttons || [];
      messageContent = node.data?.message || node.data?.label || '';
      if (replies.length > 0) {
        messageContent += '\n\n' + replies.map((r: any) => `• ${typeof r === 'string' ? r : (r?.text || '')}`).join('\n');
      }
    } else if (type === 'questionnode' || type === 'question') {
      messageContent = node.data?.question || node.data?.label || '';
    }

    messageContent = replaceVars(messageContent);

    if (messageContent || mediaUrl) {
      await supabase.from('chatbot_messages').insert({
        conversation_id: convId,
        role: 'bot',
        content: messageContent,
        media_url: mediaUrl || null,
        media_type: mediaType || null,
        node_id: node.id,
      });
    }
  };

  // Helpers de fluxo
  const isInteractiveNode = (node: any) => {
    const t = (node?.type || '').toLowerCase();
    return t === 'buttonnode' || t === 'button' || t === 'quickreplynode' || t === 'quickreply' || t === 'questionnode' || t === 'question';
  };

  const walkFromNode = async (startNode: any, nodes: any[], edges: any[], convId: string) => {
    const visited = new Set<string>();
    let current: any = startNode;
    while (current && !visited.has(current.id)) {
      visited.add(current.id);
      await insertNodeAsMessage(current, convId);
      if (isInteractiveNode(current)) break;
      const outs = edges.filter((e: any) => e.source === current.id);
      if (!outs.length) break;
      const nextId = outs[0].target;
      current = nodes.find((n: any) => n.id === nextId);
    }
  };

  const processInitialFlow = async (chatbot: any) => {
    // This function is called before conversation is created
    // Just marks that flow should be processed
  };
  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('chatbot-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chatbot_messages',
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
    const userMessage = input.trim();
    setInput("");

    try {
      // Save user message with customer name
      await supabase.from('chatbot_messages').insert({
        conversation_id: conversationId,
        role: 'user',
        content: userMessage,
        sender_name: customer?.name || 'Visitante',
      });

      // Update conversation last_message_at
      await supabase
        .from('chatbot_conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

      // 1) Verificar contexto do fluxo (qual node estamos esperando resposta)
      const nodes = chatbotInfo?.config?.nodes || [];
      const edges = chatbotInfo?.config?.edges || [];
      
      // Buscar última mensagem do bot para saber qual node foi enviado
      const lastBotMsg = messages.filter(m => m.role === 'bot').pop();
      const lastNodeId = (lastBotMsg as any)?.node_id;
      
      let nextNode = null;
      
      // Se há um node ativo, procurar o próximo no fluxo
      if (lastNodeId) {
        const connectedEdges = edges.filter((e: any) => e.source === lastNodeId);
        
        // Para button/quickReply nodes, verificar qual botão foi clicado
        const lastNode = nodes.find((n: any) => n.id === lastNodeId);
        const nodeType = (lastNode?.type || '').toLowerCase();
        
        if ((nodeType === 'buttonnode' || nodeType === 'button' || 
             nodeType === 'quickreplynode' || nodeType === 'quickreply') && connectedEdges.length > 0) {
          // Buscar edge que corresponde à resposta do usuário
          const buttons = lastNode?.data?.buttons || lastNode?.data?.quickReplies || [];
          const buttonIndex = buttons.findIndex((b: any) => {
            const btnText = (typeof b === 'string' ? b : b?.text || '').toLowerCase();
            return userMessage.toLowerCase().includes(btnText);
          });
          
          if (buttonIndex >= 0 && connectedEdges[buttonIndex]) {
            // Usar edge específica do botão
            nextNode = nodes.find((n: any) => n.id === connectedEdges[buttonIndex].target);
          } else if (connectedEdges.length > 0) {
            // Fallback: usar primeira edge
            nextNode = nodes.find((n: any) => n.id === connectedEdges[0].target);
          }
        } else if (connectedEdges.length > 0) {
          // Para outros tipos de node, seguir primeira edge
          nextNode = nodes.find((n: any) => n.id === connectedEdges[0].target);
        }
      }
      
      // 2) Palavras‑chave: procurar bloco correspondente (fallback)
      if (!nextNode) {
        const lower = userMessage.toLowerCase();
        nextNode = nodes.find((n: any) => {
          const raw = n?.data?.keyword || '';
          if (!raw) return false;
          const list = String(raw)
            .split(',')
            .map((k: string) => k.trim().toLowerCase())
            .filter(Boolean);
          return list.some((k: string) => lower === k || lower.includes(k));
        });
      }

      if (nextNode) {
        // Seguir o fluxo a partir do próximo nó, emitindo mensagens em sequência até um nó interativo
        await walkFromNode(nextNode, nodes, edges, conversationId);
      }

      // Observação: próximo passo do fluxo via edges pode ser implementado aqui, se necessário
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
    localStorage.removeItem(`chatbot_customer_${chatbotId}`);
    navigate(`/chatbot-auth/${chatbotId}`);
  };

  return (
    <div className="min-h-screen gradient-primary">
      <div className="container mx-auto max-w-4xl h-screen flex flex-col p-4">
        <Card className="flex-1 flex flex-col">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">{chatbotInfo?.name || 'Chat'}</h2>
                <p className="text-sm text-muted-foreground">Olá, {customer?.name}!</p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="w-5 h-5" />
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {hasServices && (
                <Button
                  onClick={() => setShowAppointmentDialog(true)}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Agendar
                </Button>
              )}
              {hasProducts && (
                <Button
                  onClick={() => setShowOrderDialog(true)}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Fazer Pedido
                </Button>
              )}
            </div>

            {/* Appointments Section */}
            {appointments.length > 0 && (
              <Collapsible open={showAppointments} onOpenChange={setShowAppointments} className="mt-4">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between">
                    <span className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Meus Agendamentos ({appointments.length})
                    </span>
                    {showAppointments ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 mt-2">
                  {appointments.map((apt) => (
                    <div key={apt.id} className="p-3 border rounded-lg bg-muted/50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {new Date(apt.date).toLocaleString('pt-BR')}
                          </p>
                          {apt.notes && (
                            <p className="text-xs text-muted-foreground mt-1">{apt.notes}</p>
                          )}
                        </div>
                        <Badge variant={apt.status === 'confirmed' ? 'default' : apt.status === 'cancelled' ? 'destructive' : 'secondary'}>
                          {apt.status === 'pending' ? 'Pendente' : apt.status === 'confirmed' ? 'Confirmado' : 'Cancelado'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Orders Section */}
            {orders.length > 0 && (
              <Collapsible open={showOrders} onOpenChange={setShowOrders} className="mt-2">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between">
                    <span className="flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4" />
                      Meus Pedidos ({orders.length})
                    </span>
                    {showOrders ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 mt-2">
                  {orders.map((order) => (
                    <div key={order.id} className="p-3 border rounded-lg bg-muted/50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm">R$ {Number(order.total).toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(order.created_at).toLocaleString('pt-BR')}
                          </p>
                        </div>
                        <Badge variant={order.status === 'confirmed' ? 'default' : order.status === 'cancelled' ? 'destructive' : 'secondary'}>
                          {order.status === 'pending' ? 'Pendente' : order.status === 'confirmed' ? 'Confirmado' : 'Cancelado'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {/* Removed static initial message - now using flow */}
              {chatbotInfo?.config?.initialMessage && messages.length === 0 && (
                <div className="flex flex-col items-start">
                  <span className="text-xs text-muted-foreground mb-1 px-1">
                    {chatbotInfo?.config?.attendantName || chatbotInfo?.name || 'Atendente'}
                  </span>
                  <div className="max-w-[80%] rounded-lg p-3 bg-muted">
                    <p className="whitespace-pre-wrap">{chatbotInfo.config.initialMessage}</p>
                  </div>
                </div>
              )}
              
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <span className="text-xs text-muted-foreground mb-1 px-1">
                    {message.role === 'user' ? customer?.name : (message.role === 'assistant' ? (message.sender_name || 'Atendente') : chatbotInfo?.name)}
                  </span>
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === 'user'
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
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

        {/* Appointment Dialog */}
        {hasServices && conversationId && customer && (
          <ChatbotAppointmentDialog
            open={showAppointmentDialog}
            onOpenChange={setShowAppointmentDialog}
            chatbotId={chatbotId!}
            customerId={customer.id}
            conversationId={conversationId}
            onSuccess={() => {
              toast({
                title: "Agendamento solicitado!",
                description: "Aguarde a confirmação",
              });
            }}
          />
        )}

        {/* Order Dialog */}
        {hasProducts && conversationId && customer && (
          <ChatbotOrderDialog
            open={showOrderDialog}
            onOpenChange={setShowOrderDialog}
            chatbotId={chatbotId!}
            customerId={customer.id}
            conversationId={conversationId}
            onSuccess={() => {
              toast({
                title: "Pedido realizado!",
                description: "Aguarde a confirmação",
              });
            }}
          />
        )}
      </div>
    </div>
  );
}
