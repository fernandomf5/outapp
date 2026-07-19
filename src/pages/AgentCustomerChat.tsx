import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Send, LogOut, Calendar, ShoppingBag, ChevronDown, ChevronUp, X, Clock, Smile, ImagePlus, FileText, ArrowDown, UserCircle, Headset } from "lucide-react";
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
import { useIsMobile } from "@/hooks/use-mobile";

interface Message {
  id: string;
  role: 'customer' | 'agent';
  content: string;
  created_at: string;
  sender_name?: string;
  media_url?: string | null;
  media_type?: string | null;
  metadata?: {
    buttons?: string[];
    trigger?: string;
  };
}

export default function AgentCustomerChat() {
  const { agentId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
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
  const [attendantStatus, setAttendantStatus] = useState<'online' | 'offline' | 'busy'>('offline');
  const [attendantName, setAttendantName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [visibleMessagesCount, setVisibleMessagesCount] = useState(20);
  const [requestingHuman, setRequestingHuman] = useState(false);
  const MAX_VISIBLE_MESSAGES = 20;

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
      const presenceCleanup = setupPresenceTracking();
      return () => {
        cleanup();
        presenceCleanup();
      };
    }
  }, [conversationId]);

  // Subscribe to attendant status changes
  useEffect(() => {
    if (!agentId) return;

    const channel = supabase
      .channel(`agent-status-${agentId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'ai_agents',
          filter: `id=eq.${agentId}`,
        },
        (payload) => {
          const agent = payload.new as any;
          if (agent.attendant_status) {
            setAttendantStatus(agent.attendant_status);
          }
          if (agent.attendant_name !== undefined) {
            setAttendantName(agent.attendant_name);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agentId]);

  // Subscribe to conversation changes (e.g., attendant restarts the flow)
  useEffect(() => {
    if (!agentId || !customer?.id) return;

    console.log('📡 Monitorando mudanças na conversa para o cliente:', customer.id);
    
    const channel = supabase
      .channel(`conversation-monitor-${customer.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agent_conversations',
          filter: `customer_id=eq.${customer.id}`,
        },
        async (payload) => {
          console.log('🔄 Mudança detectada na tabela de conversas:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newConv = payload.new as any;
            if (newConv.agent_id === agentId && newConv.status === 'active') {
              console.log('🆕 Nova conversa ativa detectada, atualizando ID:', newConv.id);
              setConversationId(newConv.id);
              // Limpar mensagens locais para o novo fluxo e resetar controle de envio
              setMessages([]);
              sentMessagesRef.current = new Set();
              
              // Buscar mensagens iniciais da nova conversa (evitar race condition com welcome message)
              setTimeout(async () => {
                const { data: newMessages } = await supabase
                  .from('agent_messages')
                  .select('*')
                  .eq('conversation_id', newConv.id)
                  .order('created_at', { ascending: true });
                
                if (newMessages && newMessages.length > 0) {
                  setMessages(newMessages as unknown as Message[]);
                }
              }, 1000); // Pequeno delay para garantir que a edge function inseriu as mensagens

              toast({
                title: "Atendimento Reiniciado",
                description: "O atendente reiniciou o fluxo de conversa.",
              });
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedConv = payload.new as any;
            // Se a conversa atual foi arquivada e não temos uma nova ainda
            if (updatedConv.id === conversationId && updatedConv.status === 'archived') {
              console.log('⚠️ Conversa atual arquivada. Aguardando nova conversa...');
              // Podemos limpar ou apenas esperar o INSERT da nova
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agentId, customer?.id, conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const isAtBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 100;
    setShowScrollButton(!isAtBottom);
  };

  const loadMoreMessages = () => {
    setVisibleMessagesCount(prev => prev + 20);
  };

  const visibleMessages = messages.slice(-visibleMessagesCount);
  const hasHiddenMessages = messages.length > visibleMessagesCount;

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
        body: { agentId, customerId, customerName, timestamp: Date.now() }
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
      
      // Se recebemos mensagens (histórico), carregamos elas
      if (data.messages && data.messages.length > 0) {
        setMessages(data.messages);
      } else {
        // Limpamos mensagens e resetamos o Set de mensagens enviadas
        setMessages([]);
        sentMessagesRef.current = new Set();
        
        // Forçar um primeiro processamento caso a Edge Function não tenha retornado mensagens
        // mas o fluxo deva iniciar (isso garante o disparo do gatilho inicial)
        if (data.conversationId) {
          console.log('Nenhuma mensagem inicial retornada, solicitando processamento...');
          await supabase.functions.invoke('process-agent-customer-message', {
            body: { 
              agentId, 
              customerId, 
              conversationId: data.conversationId, 
              message: '',
              timestamp: Date.now()
            }
          });
        }
      }
      
      // Set attendant status from agent data
      if (data.agent?.attendant_status) {
        setAttendantStatus(data.agent.attendant_status);
      }
      if (data.agent?.attendant_name) {
        setAttendantName(data.agent.attendant_name);
      }

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


  const setupPresenceTracking = () => {
    if (!conversationId || !customer?.id || !agentId) return () => {};

    console.log('🚀 Configurando presença do cliente:', {
      agentId,
      customerId: customer.id,
      customerName: customer.name,
      conversationId
    });

    const channel = supabase.channel(`agent-conversations-${agentId}`, {
      config: {
        presence: {
          key: customer.id,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        console.log('✅ Cliente - Presença sincronizada:', state);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('✅ Cliente - Alguém entrou:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('✅ Cliente - Alguém saiu:', key, leftPresences);
      })
      .subscribe(async (status) => {
        console.log('📡 Status da subscrição do cliente:', status);
        if (status === 'SUBSCRIBED') {
          const trackResult = await channel.track({
            customer_id: customer.id,
            customer_name: customer.name,
            conversation_id: conversationId,
            online_at: new Date().toISOString(),
          });
          console.log('✅ Cliente marcado como online:', customer.id, 'Result:', trackResult);
        }
      });

    // Heartbeat para manter presença
    const heartbeat = setInterval(async () => {
      const trackResult = await channel.track({
        customer_id: customer.id,
        customer_name: customer.name,
        conversation_id: conversationId,
        online_at: new Date().toISOString(),
      });
      console.log('💓 Heartbeat enviado:', trackResult);
    }, 30000); // A cada 30 segundos

    return () => {
      console.log('🔌 Desconectando cliente:', customer.id);
      clearInterval(heartbeat);
      channel.untrack();
      supabase.removeChannel(channel);
    };
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
          console.log('Dados da nova mensagem:', newMessage);
          
          // Se for uma mensagem automática de gatilho inicial, sempre adicionamos se a lista estiver vazia
          const isInitialTrigger = newMessage.metadata?.trigger === 'initial';
          const key = `${newMessage.role}:${newMessage.content}`;
          
          if (newMessage.role === 'customer' && sentMessagesRef.current.has(key)) {
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
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${type}s/${fileName}`;

      console.log(`Uploading ${type}: ${filePath}`);
      
      const buckets = ['chatbot-media', 'agent-media', 'messages-media', 'customer-media'];
      let lastError = null;

      for (const bucket of buckets) {
        try {
          console.log(`Tentando upload no bucket: ${bucket}`);
          const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false
            });

          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from(bucket)
              .getPublicUrl(filePath);
            
            console.log(`Upload bem sucedido no bucket: ${bucket}`);
            return publicUrl;
          } else {
            console.warn(`Erro no bucket ${bucket}:`, uploadError.message);
            lastError = uploadError;
          }
        } catch (err) {
          console.error(`Erro inesperado no bucket ${bucket}:`, err);
          lastError = err;
        }
      }

      throw lastError || new Error("Falha no upload");
    } catch (error: any) {
      console.error('Final upload error:', error);
      toast({
        title: "Erro no envio",
        description: error.message || "Não foi possível enviar o arquivo.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleRequestHuman = async () => {
    if (!conversationId || requestingHuman || !customer) return;
    
    setRequestingHuman(true);
    try {
      // 1. Enviar mensagem do cliente
      const content = "Preciso falar com um atendente humano.";
      
      // Adicionar mensagem do cliente otimisticamente na UI
      const optimisticMessage: Message = {
        id: crypto.randomUUID(),
        role: 'customer',
        content: content,
        created_at: new Date().toISOString(),
        sender_name: customer.name,
      };
      setMessages(prev => [...prev, optimisticMessage]);
      chatSounds.playSendSound();

      // 2. Chamar a Edge Function com flag para forçar atendimento humano
      const { error } = await supabase.functions.invoke('process-agent-customer-message', {
        body: { 
          agentId, 
          customerId: customer.id, 
          conversationId, 
          message: content,
          forceHuman: true 
        }
      });

      if (error) throw error;

      toast({
        title: "Solicitação enviada",
        description: "Um atendente humano foi notificado para assumir o chat.",
      });

    } catch (error) {
      console.error('Error requesting human:', error);
      toast({
        title: "Erro",
        description: "Não foi possível solicitar atendimento humano.",
        variant: "destructive",
      });
    } finally {
      setRequestingHuman(false);
    }
  };

  const handleSendMessage = async () => {
    if ((!input.trim() && !selectedImage && !selectedDocument) || !conversationId || !customer) return;

    setLoading(true);
    setUploadingMedia(true);
    const originalInput = input;
    const imageFile = selectedImage;
    const docFile = selectedDocument;
    
    // Clear inputs immediately
    setInput("");
    setSelectedImage(null);
    setSelectedDocument(null);
    setImagePreview(null);

    // Adicionar mensagem do cliente otimisticamente na UI
    const messageContent = originalInput || (imageFile ? '📷 Imagem' : '📄 Documento');
    const optimisticKey = `customer:${messageContent}`;
    sentMessagesRef.current.add(optimisticKey);
    
    const optimisticMessage: Message = {
      id: crypto.randomUUID(),
      role: 'customer',
      content: messageContent,
      created_at: new Date().toISOString(),
      sender_name: customer.name,
      media_url: null,
      media_type: null,
    };
    setMessages(prev => [...prev, optimisticMessage]);

    // Tocar som de envio
    chatSounds.playSendSound();

    try {
      let mediaUrl = null;
      let mediaType = null;

      // Upload image or document if selected
      if (imageFile) {
        mediaUrl = await uploadFile(imageFile, 'image');
        mediaType = 'image';
        // Atualizar a mensagem otimística com a URL da mídia
        setMessages(prev => prev.map(m => 
          m.id === optimisticMessage.id 
            ? { ...m, media_url: mediaUrl, media_type: mediaType }
            : m
        ));
      } else if (docFile) {
        mediaUrl = await uploadFile(docFile, 'document');
        mediaType = 'document';
        setMessages(prev => prev.map(m => 
          m.id === optimisticMessage.id 
            ? { ...m, media_url: mediaUrl, media_type: mediaType }
            : m
        ));
      }

      // Save customer message with media
      await supabase.from('agent_messages').insert({
        conversation_id: conversationId,
        role: 'customer',
        content: messageContent,
        sender_name: customer.name,
        media_url: mediaUrl,
        media_type: mediaType,
      });

      // Processar mensagem com IA/Fluxo
      await supabase.functions.invoke('process-agent-customer-message', {
        body: {
          agentId,
          customerId: customer.id,
          conversationId,
          message: messageContent
        }
      });
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

  const primaryColor = agentInfo?.config?.primaryColor || '#6366f1';
  const secondaryColor = agentInfo?.config?.secondaryColor || '#8b5cf6';
  const logoUrl = agentInfo?.config?.logoUrl || '';

  // Mostrar loading enquanto carrega as informações do agente (incluindo cores)
  if (!agentInfo) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Carregando chat...</p>
        </div>
      </div>
    );
  }

  const handleHumanAttendant = async () => {
    if (!conversationId) return;
    
    chatSounds.playSendSound();
    
    // Simular envio de mensagem solicitando humano
    const message = "Gostaria de falar com um atendente humano.";
    const { error } = await supabase.from('agent_messages').insert({
      conversation_id: conversationId,
      role: 'customer',
      content: message,
      sender_name: customer?.name || 'Cliente'
    });

    if (error) {
      toast({ title: "Erro", description: "Não foi possível solicitar atendimento", variant: "destructive" });
      return;
    }

    toast({
      title: "Solicitação enviada",
      description: "Um atendente humano foi notificado. Por favor, aguarde.",
    });
  };

  return (
    <div className="min-h-dvh bg-transparent">
      <div className="container mx-auto max-w-4xl h-dvh flex flex-col p-0 sm:p-4">
        <Card className="flex-1 flex flex-col relative rounded-none sm:rounded-lg">
          {/* Header fixo */}
          <div className="sticky top-0 z-10 p-3 sm:p-4 border-b flex items-center justify-between gap-2" style={{ backgroundColor: primaryColor, color: 'white' }}>
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              {/* Logo e Nome */}
              {logoUrl && (
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden bg-white/20 flex-shrink-0 border border-white/30">
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                  <h2 className="text-base sm:text-xl font-bold truncate">{agentInfo?.name || 'Atendimento'}</h2>
                  {/* Status do Atendente */}
                  <Badge 
                    variant="outline" 
                    className={`text-[10px] sm:text-xs shrink-0 ${
                      attendantStatus === 'online' 
                        ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' 
                        : attendantStatus === 'busy'
                          ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                          : 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full mr-1 ${
                      attendantStatus === 'online' ? 'bg-green-500' :
                      attendantStatus === 'busy' ? 'bg-yellow-500' : 'bg-blue-500'
                    }`} />
                    <span className="hidden sm:inline">
                      {attendantStatus === 'online' ? 'Atendente Online' : 
                       attendantStatus === 'busy' ? 'Em Atendimento' : 'Agente IA Ativo'}
                    </span>
                    <span className="sm:hidden">
                      {attendantStatus === 'online' ? 'Online' : 
                       attendantStatus === 'busy' ? 'Ocupado' : 'Agente IA'}
                    </span>
                  </Badge>
                </div>
                <div className="text-xs sm:text-sm opacity-80">
                  <p className="font-medium">Olá, {customer?.name}! 👋</p>
                  <p className="text-[10px] sm:text-xs opacity-90">
                    Que bom ver você por aqui!
                    {attendantName && attendantStatus !== 'offline' && (
                      <span className="ml-1 hidden sm:inline">• Atendido por {attendantName}</span>
                    )}
                  </p>
                </div>
                
                {/* Informação de acesso privado */}
                {agentInfo?.access_type === 'private' && accessInfo && (
                  <Alert className={`mt-2 py-1.5 sm:py-2 ${accessInfo.daysRemaining <= 3 ? 'border-destructive' : 'border-primary'}`}>
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                    <AlertDescription className="ml-2 text-xs sm:text-sm">
                      {accessInfo.daysRemaining > 0 ? (
                        <>
                          Acesso: <span className="font-semibold">{accessInfo.daysRemaining}</span> dia{accessInfo.daysRemaining !== 1 ? 's' : ''}
                        </>
                      ) : (
                        <span className="text-destructive font-semibold">Expira hoje!</span>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRequestHuman}
                disabled={requestingHuman || attendantStatus === 'online'}
                className="flex items-center gap-2 h-8 text-xs border-white/20 text-white hover:bg-white/10 px-2 sm:px-3"
              >
                <Headset className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">
                  {attendantStatus === 'online' ? 'Em Atendimento' : 'Falar com Humano'}
                </span>
                <span className="xs:hidden">Humano</span>
              </Button>
              
              {window.self === window.top && (
                <Button variant="ghost" size="icon" onClick={handleLogout} className="h-8 w-8 sm:h-10 sm:w-10">
                  <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              )}
            </div>
          </div>

          <div 
            ref={scrollAreaRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-4 pb-28"
          >
            <div className="space-y-4">
              {/* Botão para carregar mensagens antigas */}
              {hasHiddenMessages && (
                <div className="flex justify-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={loadMoreMessages}
                    className="text-muted-foreground"
                  >
                    <ChevronUp className="w-4 h-4 mr-1" />
                    Carregar mensagens anteriores ({messages.length - visibleMessagesCount} ocultas)
                  </Button>
                </div>
              )}
              
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
              
              {visibleMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex flex-col ${message.role === 'customer' ? 'items-end' : 'items-start'}`}
                >
                  <span className="text-xs text-muted-foreground mb-1 px-1">
                    {message.role === 'customer' ? customer?.name : (message.sender_name || agentInfo?.name)}
                  </span>
                  <div
                    className="max-w-[85%] sm:max-w-[70%] rounded-lg p-3"
                    style={message.role === 'customer' 
                      ? { backgroundColor: primaryColor, color: 'white' }
                      : { backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--foreground))' }
                    }
                  >
                    {message.media_url && message.media_type === 'image' && (
                      <div className="mb-2 rounded-lg overflow-hidden border border-black/5 dark:border-white/5">
                        <img 
                          src={message.media_url} 
                          alt="Imagem enviada" 
                          className="max-w-full h-auto max-h-[400px] object-contain mx-auto"
                          loading="lazy"
                        />
                      </div>
                    )}
                    {message.media_url && message.media_type === 'video' && (
                      <div className="mb-2 rounded-lg overflow-hidden border border-black/5 dark:border-white/5 bg-black/5 dark:bg-black/20">
                        <video controls className="w-full max-h-[400px] rounded-md">
                          <source src={message.media_url} />
                          Seu navegador não suporta vídeos.
                        </video>
                      </div>
                    )}
                    {message.media_url && message.media_type === 'audio' && (
                      <div className="mb-2 p-2 rounded-lg bg-black/5 dark:bg-black/20">
                        <audio controls className="w-full h-10">
                          <source src={message.media_url} />
                          Seu navegador não suporta áudio.
                        </audio>
                      </div>
                    )}
                    {message.media_url && message.media_type === 'document' && (
                      <div className="mb-2">
                        <a 
                          href={message.media_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 text-sm font-medium p-3 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all group"
                        >
                          <div className="p-2 bg-primary/10 rounded-lg group-hover:scale-110 transition-transform">
                            <FileText className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="block truncate">Ver documento</span>
                            <span className="text-[10px] opacity-60 uppercase">Clique para abrir</span>
                          </div>
                        </a>
                      </div>
                    )}
                    <p className="whitespace-pre-wrap">{linkifyText(message.content)}</p>
                    {message.metadata?.buttons && message.metadata.buttons.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {message.metadata.buttons.map((btn: any, idx: number) => (
                          <Button
                            key={idx}
                            variant="outline"
                            size="sm"
                            className="bg-white hover:bg-white/90 text-primary border-white shrink-0 max-w-full"
                            onClick={() => {
                              setInput(typeof btn === 'string' ? btn : btn.text);
                              // Trigger send in next tick
                              setTimeout(() => {
                                const submitBtn = document.querySelector('button[type="submit"]') as HTMLButtonElement;
                                submitBtn?.click();
                              }, 100);
                            }}
                          >
                            {typeof btn === 'string' ? btn : btn.text}
                          </Button>
                        ))}
                      </div>
                    )}
                    <span className="text-xs opacity-70 mt-1 block">
                      {new Date(message.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Botão para descer */}
          {showScrollButton && (
            <Button
              size="icon"
              className={`absolute right-4 rounded-full shadow-lg z-10 text-white ${window.self !== window.top ? 'bottom-24' : 'bottom-32'}`}
              style={{ backgroundColor: primaryColor }}
              onClick={scrollToBottom}
            >
              <ArrowDown className="w-5 h-5" />
            </Button>
          )}

          <div className="p-3 sm:p-4 border-t space-y-2">
            <div className="flex justify-center sm:hidden">
              {agentInfo?.config?.ai_enabled !== false && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRequestHuman}
                  disabled={requestingHuman || attendantStatus === 'online'}
                  className="gap-2 text-xs font-medium hover:bg-primary/5 border border-dashed border-primary/20 w-full mb-2"
                  style={{ color: primaryColor, borderColor: `${primaryColor}40` }}
                >
                  <Headset className="w-4 h-4" />
                  {attendantStatus === 'online' ? 'Já em atendimento humano' : 'Falar com Atendente Humano'}
                </Button>
              )}
            </div>
            {(hasServices || hasProducts) && (
              <div className={`grid gap-2 ${hasServices && hasProducts ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {hasServices && (
                  <Button
                    variant="outline"
                    className="flex flex-col items-center justify-center gap-1 h-auto py-2 sm:flex-row sm:py-2 sm:gap-2"
                    style={{ borderColor: primaryColor, color: primaryColor }}
                    onClick={() => setShowAppointmentDialog(true)}
                  >
                    <Calendar className="w-5 h-5 sm:w-4 sm:h-4" />
                    <span className="text-xs sm:text-sm">Agendar</span>
                  </Button>
                )}
                {hasProducts && (
                  <Button
                    variant="outline"
                    className="flex flex-col items-center justify-center gap-1 h-auto py-2 sm:flex-row sm:py-2 sm:gap-2"
                    style={{ borderColor: primaryColor, color: primaryColor }}
                    onClick={() => setShowOrderDialog(true)}
                  >
                    <ShoppingBag className="w-5 h-5 sm:w-4 sm:h-4" />
                    <span className="text-xs sm:text-sm">Fazer Pedido</span>
                  </Button>
                )}
              </div>
            )}

            {/* Meus Agendamentos */}
            {appointments.length > 0 && (
              <Collapsible open={showAppointments} onOpenChange={setShowAppointments}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span className="hidden xs:inline">Meus </span>Agendamentos
                      <Badge variant="secondary" className="text-xs">{appointments.length}</Badge>
                    </span>
                    {showAppointments ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 mt-2 max-h-48 overflow-y-auto">
                  {appointments.map((appointment) => (
                    <Card key={appointment.id} className="p-2 sm:p-3">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{appointment.service_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(appointment.scheduled_date).toLocaleString('pt-BR', { 
                              day: '2-digit', 
                              month: '2-digit', 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                        <div className="flex flex-col gap-1 items-end shrink-0">
                          <Badge 
                            variant={
                              appointment.status === 'confirmed' ? 'default' : 
                              appointment.status === 'rejected' ? 'destructive' :
                              appointment.status === 'cancelled' ? 'destructive' :
                              'secondary'
                            }
                            className="text-[10px] sm:text-xs"
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
                              className="h-6 text-xs px-2"
                              onClick={() => setCancelDialog({ open: true, type: 'appointment', id: appointment.id })}
                            >
                              <X className="w-3 h-3 mr-1" />
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
                  <Button variant="ghost" className="w-full justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4" />
                      <span className="hidden xs:inline">Meus </span>Pedidos
                      <Badge variant="secondary" className="text-xs">{orders.length}</Badge>
                    </span>
                    {showOrders ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 mt-2 max-h-48 overflow-y-auto">
                  {orders.map((order) => (
                    <Card key={order.id} className="p-2 sm:p-3">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">Pedido #{order.order_number}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(order.created_at).toLocaleString('pt-BR', { 
                              day: '2-digit', 
                              month: '2-digit', 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                          <p className="text-xs font-medium mt-1">
                            R$ {Number(order.total_amount).toFixed(2)}
                          </p>
                        </div>
                        <div className="flex flex-col gap-1 items-end shrink-0">
                          <Badge 
                            variant={
                              order.status === 'confirmed' ? 'default' : 
                              order.status === 'delivered' ? 'default' :
                              order.status === 'cancelled' ? 'destructive' : 
                              'secondary'
                            }
                            className="text-[10px] sm:text-xs"
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
                              className="h-6 text-xs px-2"
                              onClick={() => setCancelDialog({ open: true, type: 'order', id: order.id })}
                            >
                              <X className="w-3 h-3 mr-1" />
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
              className={isMobile ? "flex flex-col gap-2" : "flex items-end gap-2"}
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
              
              {/* Primeira linha no mobile: Emoji, Imagem, Documento */}
              <div className={isMobile ? "flex gap-2" : "contents"}>
                <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="icon" type="button" className="h-11 w-11 md:h-10 md:w-10">
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
                  variant="outline"
                  size="icon"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingMedia || !!selectedDocument}
                  className="h-11 w-11 md:h-10 md:w-10"
                >
                  <ImagePlus className="w-5 h-5" />
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  type="button"
                  onClick={() => docInputRef.current?.click()}
                  disabled={uploadingMedia || !!selectedImage}
                  className="h-11 w-11 md:h-10 md:w-10"
                >
                  <FileText className="w-5 h-5" />
                </Button>
              </div>

              {/* Segunda linha no mobile: Textarea e Botão Enviar */}
              <div className={isMobile ? "flex items-end gap-2" : "contents"}>
                <textarea
                  value={input}
                  onChange={(e) => {
                    const el = e.currentTarget;
                    setInput(el.value);
                    el.style.height = 'auto';
                    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
                    if (el.value.length > input.length) {
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
                  rows={1}
                  className="flex-1 resize-none rounded-md border border-input bg-background text-foreground px-4 py-3 md:py-2 leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/30 max-h-40"
                />

                <Button 
                  type="submit"
                  disabled={loading || uploadingMedia || (!input.trim() && !selectedImage && !selectedDocument)}
                  className="h-11 w-11 md:h-10 md:w-10 text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
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