import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Send, LogOut, Calendar, ShoppingBag, ChevronDown, ChevronUp, X, Clock, Smile, ImagePlus, FileText } from "lucide-react";
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import AgentAppointmentDialog from "@/components/AgentAppointmentDialog";
import AgentOrderDialog from "@/components/AgentOrderDialog";
import { chatSounds } from "@/utils/chatSounds";
import { linkifyText } from "@/utils/linkify";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Message {
  id: string;
  role: 'customer' | 'agent';
  content: string;
  created_at: string;
  sender_name?: string;
  media_url?: string | null;
  media_type?: string | null;
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
  const [cancelDialog, setCancelDialog] = useState<{open: boolean, type: 'appointment' | 'order', id: string}>({
    open: false,
    type: 'appointment',
    id: ''
  });
  const [cancelReason, setCancelReason] = useState("");
  const [accessInfo, setAccessInfo] = useState<{
    daysRemaining: number;
    expiresAt: string;
  } | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

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

      if (error) {
        let errorMessage = "Não foi possível conectar ao agente";
        if (error.message) {
          errorMessage = error.message.includes("non-2xx") 
            ? "Serviço temporariamente indisponível. Tente novamente em alguns instantes."
            : error.message;
        }
        toast({
          title: "Erro de conexão",
          description: errorMessage,
          variant: "destructive",
        });
        navigate(`/agent-auth/${agentId}`, { replace: true });
        return;
      }
      
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

      // Para acesso privado, buscar informações de expiração
      if (data.agent?.access_type === 'private') {
        const { data: accessRequest } = await supabase
          .from('agent_access_requests')
          .select('expires_at, access_duration_days')
          .eq('agent_id', agentId)
          .eq('customer_id', customerId)
          .eq('status', 'approved')
          .eq('is_active', true)
          .single();

        if (accessRequest?.expires_at) {
          const expiresAt = new Date(accessRequest.expires_at);
          const now = new Date();
          const diffTime = expiresAt.getTime() - now.getTime();
          const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          setAccessInfo({
            daysRemaining,
            expiresAt: accessRequest.expires_at
          });
        }
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
          // Tocar som de mensagem recebida do agente
          if (newMessage.role === 'agent') {
            chatSounds.playReceiveSound();
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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "A imagem deve ter no máximo 5MB",
          variant: "destructive",
        });
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDocumentSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "O documento deve ter no máximo 10MB",
          variant: "destructive",
        });
        return;
      }
      setSelectedDocument(file);
    }
  };

  const uploadFile = async (file: File, type: 'image' | 'document'): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `${type}s/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('chat-media')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('chat-media')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSendMessage = async () => {
    if ((!input.trim() && !selectedImage && !selectedDocument) || !conversationId || !customer) return;

    setLoading(true);
    setUploadingMedia(true);
    const originalInput = input;
    const imageFile = selectedImage;
    const docFile = selectedDocument;
    setInput("");
    setSelectedImage(null);
    setSelectedDocument(null);
    setImagePreview(null);

    try {
      let mediaUrl = null;
      let mediaType = null;

      // Upload image or document if selected
      if (imageFile) {
        mediaUrl = await uploadFile(imageFile, 'image');
        mediaType = 'image';
      } else if (docFile) {
        mediaUrl = await uploadFile(docFile, 'document');
        mediaType = 'document';
      }

      // Save customer message with media
      await supabase.from('agent_messages').insert({
        conversation_id: conversationId,
        role: 'customer',
        content: originalInput || (mediaType === 'image' ? '📷 Imagem' : '📄 Documento'),
        sender_name: customer.name,
        media_url: mediaUrl,
        media_type: mediaType,
      });

      // Tocar som de envio
      chatSounds.playSendSound();

      // Process message via edge function (handles AI response) if there's text
      if (originalInput.trim()) {
        const { data, error } = await supabase.functions.invoke('process-agent-customer-message', {
          body: {
            agentId,
            customerId: customer.id,
            conversationId,
            message: originalInput,
          }
        });

        if (error) {
          let errorMessage = "Não foi possível processar sua mensagem";
          if (error.message) {
            errorMessage = error.message.includes("non-2xx") 
              ? "Serviço temporariamente indisponível. Tente novamente em alguns instantes."
              : error.message;
          }
          throw new Error(errorMessage);
        }

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
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível enviar sua mensagem",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setUploadingMedia(false);
    }
  };

  const onEmojiSelect = (emoji: any) => {
    setInput(input + emoji.native);
    setShowEmojiPicker(false);
  };

  const handleLogout = () => {
    localStorage.removeItem(`agent_customer_${agentId}`);
    navigate(`/agent-auth/${agentId}`);
  };

  const handleCancelAppointment = async () => {
    if (!cancelReason.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, informe o motivo do cancelamento",
        variant: "destructive",
      });
      return;
    }

    try {
      const appointment = appointments.find(a => a.id === cancelDialog.id);
      
      // Update appointment status
      const { error } = await supabase
        .from('agent_appointments')
        .update({ 
          status: 'cancelled',
          customer_notes: cancelReason.trim()
        })
        .eq('id', cancelDialog.id);

      if (error) throw error;

      // Send cancellation message to chat
      if (conversationId) {
        await supabase.from('agent_messages').insert({
          conversation_id: conversationId,
          role: 'customer',
          content: `❌ Agendamento Cancelado\n\nServiço: ${appointment.service_name}\nData: ${new Date(appointment.scheduled_date).toLocaleString('pt-BR')}\nMotivo: ${cancelReason.trim()}`,
          sender_name: customer?.name
        });
      }

      toast({
        title: "Agendamento cancelado",
        description: "O agente foi notificado sobre o cancelamento",
      });

      setCancelDialog({ open: false, type: 'appointment', id: '' });
      setCancelReason('');
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível cancelar o agendamento",
        variant: "destructive",
      });
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, informe o motivo do cancelamento",
        variant: "destructive",
      });
      return;
    }

    try {
      const order = orders.find(o => o.id === cancelDialog.id);
      
      // Update order status
      const { error } = await supabase
        .from('agent_orders')
        .update({ 
          status: 'cancelled',
          customer_notes: cancelReason.trim()
        })
        .eq('id', cancelDialog.id);

      if (error) throw error;

      // Send cancellation message to chat
      if (conversationId) {
        await supabase.from('agent_messages').insert({
          conversation_id: conversationId,
          role: 'customer',
          content: `❌ Pedido Cancelado\n\nPedido: #${order.order_number}\nTotal: R$ ${Number(order.total_amount).toFixed(2)}\nMotivo: ${cancelReason.trim()}`,
          sender_name: customer?.name
        });
      }

      toast({
        title: "Pedido cancelado",
        description: "O agente foi notificado sobre o cancelamento",
      });

      setCancelDialog({ open: false, type: 'order', id: '' });
      setCancelReason('');
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível cancelar o pedido",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen gradient-primary">
      <div className="container mx-auto max-w-4xl h-screen flex flex-col p-4">
        <Card className="flex-1 flex flex-col">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-bold">{agentInfo?.name || 'Atendimento'}</h2>
              <p className="text-sm text-muted-foreground">Olá, {customer?.name}!</p>
              
              {/* Informação de acesso privado */}
              {agentInfo?.access_type === 'private' && accessInfo && (
                <Alert className={`mt-2 py-2 ${accessInfo.daysRemaining <= 3 ? 'border-destructive' : 'border-primary'}`}>
                  <Clock className="h-4 w-4" />
                  <AlertDescription className="ml-2">
                    {accessInfo.daysRemaining > 0 ? (
                      <>
                        Acesso válido por <span className="font-semibold">{accessInfo.daysRemaining}</span> dia{accessInfo.daysRemaining !== 1 ? 's' : ''}
                      </>
                    ) : (
                      <span className="text-destructive font-semibold">Acesso expira hoje!</span>
                    )}
                  </AlertDescription>
                </Alert>
              )}
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
                    {message.media_url && message.media_type === 'image' && (
                      <img 
                        src={message.media_url} 
                        alt="Imagem enviada" 
                        className="max-w-full rounded mb-2 max-h-64 object-contain"
                      />
                    )}
                    {message.media_url && message.media_type === 'document' && (
                      <a 
                        href={message.media_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm underline mb-2"
                      >
                        <FileText className="w-4 h-4" />
                        Ver documento
                      </a>
                    )}
                    <p className="whitespace-pre-wrap">{linkifyText(message.content)}</p>
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
                      <div className="flex justify-between items-start gap-2">
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
                        <div className="flex flex-col gap-2 items-end">
                          <Badge 
                            variant={
                              appointment.status === 'confirmed' ? 'default' : 
                              appointment.status === 'rejected' ? 'destructive' :
                              appointment.status === 'cancelled' ? 'destructive' :
                              'secondary'
                            }
                          >
                            {appointment.status === 'pending' && 'Pendente'}
                            {appointment.status === 'confirmed' && 'Confirmado'}
                            {appointment.status === 'rejected' && 'Recusado'}
                            {appointment.status === 'rescheduled' && 'Reagendado'}
                            {appointment.status === 'cancelled' && 'Cancelado'}
                          </Badge>
                          {appointment.status !== 'cancelled' && appointment.status !== 'rejected' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setCancelDialog({ open: true, type: 'appointment', id: appointment.id })}
                            >
                              <X className="w-4 h-4 mr-1" />
                              Cancelar
                            </Button>
                          )}
                        </div>
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
                      <div className="flex justify-between items-start gap-2">
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
                        <div className="flex flex-col gap-2 items-end">
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
                          {order.status !== 'cancelled' && order.status !== 'delivered' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setCancelDialog({ open: true, type: 'order', id: order.id })}
                            >
                              <X className="w-4 h-4 mr-1" />
                              Cancelar
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Preview de imagem selecionada */}
            {imagePreview && (
              <div className="relative inline-block mb-2">
                <img src={imagePreview} alt="Preview" className="max-h-32 rounded" />
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                  onClick={() => {
                    setSelectedImage(null);
                    setImagePreview(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Preview de documento selecionado */}
            {selectedDocument && (
              <div className="flex items-center gap-2 bg-muted p-2 rounded mb-2">
                <FileText className="w-4 h-4" />
                <span className="text-sm flex-1">{selectedDocument.name}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={() => setSelectedDocument(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!loading && !uploadingMedia && (input.trim() || selectedImage || selectedDocument)) {
                  handleSendMessage();
                }
              }}
              className="flex gap-2"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
              />
              <input
                ref={docInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                className="hidden"
                onChange={handleDocumentSelect}
              />
              
              <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" type="button">
                    <Smile className="w-5 h-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Picker 
                    data={data} 
                    onEmojiSelect={onEmojiSelect}
                    theme="light"
                    locale="pt"
                  />
                </PopoverContent>
              </Popover>

              <Button
                variant="ghost"
                size="icon"
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingMedia || !!selectedDocument}
              >
                <ImagePlus className="w-5 h-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                type="button"
                onClick={() => docInputRef.current?.click()}
                disabled={uploadingMedia || !!selectedImage}
              >
                <FileText className="w-5 h-5" />
              </Button>

              <Input
                value={input}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setInput(newValue);
                  if (newValue.length > input.length) {
                    chatSounds.playTypingSound();
                  }
                }}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === 'NumpadEnter') && !e.shiftKey && !loading) {
                    e.preventDefault();
                    if (!uploadingMedia && (input.trim() || selectedImage || selectedDocument)) {
                      handleSendMessage();
                    }
                  }
                }}
                placeholder="Digite sua mensagem..."
                disabled={loading || uploadingMedia}
                className="flex-1"
              />
              <Button 
                type="submit"
                disabled={loading || uploadingMedia || (!input.trim() && !selectedImage && !selectedDocument)}
              >
                <Send className="w-5 h-5" />
              </Button>
            </form>
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

        <Dialog open={cancelDialog.open} onOpenChange={(open) => {
          setCancelDialog({ ...cancelDialog, open });
          if (!open) setCancelReason('');
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Cancelar {cancelDialog.type === 'appointment' ? 'Agendamento' : 'Pedido'}
              </DialogTitle>
              <DialogDescription>
                Por favor, informe o motivo do cancelamento. O agente será notificado.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="cancelReason">Motivo do cancelamento</Label>
                <Textarea
                  id="cancelReason"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Descreva o motivo do cancelamento..."
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {cancelReason.length}/500 caracteres
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setCancelDialog({ open: false, type: 'appointment', id: '' });
                  setCancelReason('');
                }}
              >
                Voltar
              </Button>
              <Button
                variant="destructive"
                onClick={cancelDialog.type === 'appointment' ? handleCancelAppointment : handleCancelOrder}
              >
                Confirmar Cancelamento
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}