import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Search, User, Send, Trash2, Smile, ImagePlus, FileText, X } from "lucide-react";
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { linkifyText } from "@/utils/linkify";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { chatSounds } from "@/utils/chatSounds";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

interface Conversation {
  id: string;
  status: string;
  created_at: string;
  last_message_at: string;
  queue_position?: number | null;
  agent_customers: {
    id: string;
    name: string;
    email: string;
  };
}


export default function AgentConversationsPanel({ agentId }: { agentId: string }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [senderName, setSenderName] = useState("");
  const [attendantStatus, setAttendantStatus] = useState<'online' | 'offline' | 'busy'>('offline');
  const [queueEnabled, setQueueEnabled] = useState(false);
  const [queueAhead, setQueueAhead] = useState(0);
  const [queueEtaMinutes, setQueueEtaMinutes] = useState(0);
  const [queueMessage, setQueueMessage] = useState("Seu atendimento está na fila de espera. Em breve um atendente responderá.");

  const [statusColors, setStatusColors] = useState({
    online: '#22c55e',
    busy: '#eab308',
    offline: '#64748b',
  });
  const [contactEmailMessage, setContactEmailMessage] = useState("Fale conosco por e-mail. Atendimento em até 24h.");
  const [contactEmailButtonText, setContactEmailButtonText] = useState("Fale conosco por e-mail");
  const [contactEmailSuccessMessage, setContactEmailSuccessMessage] = useState("Sua mensagem foi enviada! Vamos te retornar por e-mail em breve.");
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [onlineCustomers, setOnlineCustomers] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Carregar nome e status salvos do localStorage e do banco
  useEffect(() => {
    const savedName = localStorage.getItem(`agent_sender_name_${agentId}`);
    if (savedName) setSenderName(savedName);
    
    // Carregar status do atendente do banco de dados
    const loadAttendantStatus = async () => {
      const { data: agent } = await supabase
        .from('ai_agents')
        .select('attendant_status, attendant_name, config')
        .eq('id', agentId)
        .single();
      
      if (agent) {
        setAttendantStatus((agent.attendant_status as 'online' | 'offline' | 'busy') || 'offline');
        if (agent.attendant_name && !savedName) {
          setSenderName(agent.attendant_name);
        }
        const cfg = (agent.config || {}) as any;
        setQueueEnabled(cfg.queueEnabled === true);
        setQueueAhead(Number(cfg.queueAhead ?? 0) || 0);
        setQueueEtaMinutes(Number(cfg.queueEtaMinutes ?? 0) || 0);
        if (cfg.queueMessage) setQueueMessage(cfg.queueMessage);

        if (cfg.statusColors) {
          setStatusColors({
            online: cfg.statusColors.online || '#22c55e',
            busy: cfg.statusColors.busy || '#eab308',
            offline: cfg.statusColors.offline || '#64748b',
          });
        }
        if (cfg.contactEmailMessage) setContactEmailMessage(cfg.contactEmailMessage);
        if (cfg.contactEmailButtonText) setContactEmailButtonText(cfg.contactEmailButtonText);
        if (cfg.contactEmailSuccessMessage) setContactEmailSuccessMessage(cfg.contactEmailSuccessMessage);
      }
    };
    
    loadAttendantStatus();
  }, [agentId]);

  // Função para atualizar status do atendente
  const updateAttendantStatus = async (status: 'online' | 'offline' | 'busy') => {
    setAttendantStatus(status);
    
    const { error } = await supabase
      .from('ai_agents')
      .update({ 
        attendant_status: status,
        attendant_name: senderName || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', agentId);
    
    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status",
        variant: "destructive",
      });
    } else {
      // Notifica os chats abertos em tempo real
      try {
        const channel = supabase.channel(`chat-status-${agentId}`);
        await channel.subscribe();
        await channel.send({
          type: 'broadcast',
          event: 'status',
          payload: { attendant_status: status, attendant_name: senderName || null },
        });
        await supabase.removeChannel(channel);
      } catch (e) {
        console.error('broadcast status error', e);
      }

      toast({
        title: "Status atualizado",
        description: `Seu status agora é ${status === 'online' ? 'Online' : status === 'busy' ? 'Ocupado' : 'Offline'}.`,
      });
    }
  };

  // Notifica os chats abertos que a fila mudou
  const broadcastQueue = async () => {
    try {
      const channel = supabase.channel(`chat-queue-${agentId}`);
      await channel.subscribe();
      await channel.send({ type: 'broadcast', event: 'queue', payload: { updatedAt: Date.now() } });
      await supabase.removeChannel(channel);
    } catch (e) {
      console.error('broadcast queue error', e);
    }
  };

  // Salvar configurações de fila de espera no config do agente
  const saveQueueSettings = async (
    enabled: boolean,
    message: string,
    ahead: number = queueAhead,
    silent = false,
    etaMinutes: number = queueEtaMinutes,
  ) => {
    const { data: agent } = await supabase
      .from('ai_agents')
      .select('config')
      .eq('id', agentId)
      .single();

    const config = {
      ...((agent?.config || {}) as any),
      queueEnabled: enabled,
      queueMessage: message,
      queueAhead: Math.max(0, Math.round(ahead || 0)),
      queueEtaMinutes: Math.max(0, Math.round(etaMinutes || 0)),
    };

    const { error } = await supabase
      .from('ai_agents')
      .update({ config, updated_at: new Date().toISOString() })
      .eq('id', agentId);

    if (error) {
      toast({ title: "Erro", description: "Não foi possível salvar a fila de espera", variant: "destructive" });
      return;
    }

    await broadcastQueue();
    if (!silent) {
      toast({ title: "Fila de espera atualizada", description: enabled ? "Clientes verão sua posição na fila." : "Fila de espera desativada." });
    }
  };

  // Define manualmente a posição de um cliente na fila
  const setConversationQueuePosition = async (conversationId: string, position: number | null) => {
    const value = position === null ? null : Math.max(0, Math.round(position));
    const { error } = await supabase
      .from('agent_conversations')
      .update({ queue_position: value })
      .eq('id', conversationId);

    if (error) {
      toast({ title: "Erro", description: "Não foi possível atualizar a posição na fila", variant: "destructive" });
      return;
    }

    setConversations((prev) => prev.map((c) => (c.id === conversationId ? { ...c, queue_position: value } : c)));
    setSelectedConversation((prev) => (prev && prev.id === conversationId ? { ...prev, queue_position: value } : prev));
    await broadcastQueue();
  };

  // "Chamar próximo": todo mundo anda uma posição na fila
  const callNextInQueue = async () => {
    const nextAhead = Math.max(0, queueAhead - 1);
    setQueueAhead(nextAhead);

    const waiting = conversations.filter((c) => (c.queue_position ?? 0) > 0);
    await Promise.all(
      waiting.map((c) =>
        supabase
          .from('agent_conversations')
          .update({ queue_position: Math.max(0, (c.queue_position ?? 0) - 1) })
          .eq('id', c.id),
      ),
    );

    setConversations((prev) =>
      prev.map((c) => ((c.queue_position ?? 0) > 0 ? { ...c, queue_position: Math.max(0, (c.queue_position ?? 0) - 1) } : c)),
    );

    await saveQueueSettings(queueEnabled, queueMessage, nextAhead, true);
    toast({ title: "Fila atualizada", description: "Todos avançaram uma posição." });
  };

  const resetQueue = async () => {
    await Promise.all(
      conversations
        .filter((c) => c.queue_position !== null && c.queue_position !== undefined)
        .map((c) => supabase.from('agent_conversations').update({ queue_position: null }).eq('id', c.id)),
    );
    setConversations((prev) => prev.map((c) => ({ ...c, queue_position: null })));
    setQueueAhead(0);
    await saveQueueSettings(queueEnabled, queueMessage, 0, true);
    toast({ title: "Fila zerada", description: "Ninguém está mais aguardando na fila." });
  };


  const saveChatConfig = async (updates: Record<string, unknown>) => {
    const { data: agent } = await supabase
      .from('ai_agents')
      .select('config')
      .eq('id', agentId)
      .single();

    const config = { ...((agent?.config || {}) as any), ...updates };

    const { error } = await supabase
      .from('ai_agents')
      .update({ config, updated_at: new Date().toISOString() })
      .eq('id', agentId);

    if (error) {
      toast({ title: "Erro", description: "Não foi possível salvar as configurações do chat", variant: "destructive" });
      return;
    }

    toast({ title: "Configurações salvas", description: "As opções do chat foram atualizadas." });
  };

  const updateStatusColor = (status: 'online' | 'busy' | 'offline', color: string) => {
    const nextColors = { ...statusColors, [status]: color };
    setStatusColors(nextColors);
    saveChatConfig({ statusColors: nextColors });
  };

  const saveContactEmailSettings = () => {
    saveChatConfig({ contactEmailMessage, contactEmailButtonText, contactEmailSuccessMessage });
  };

  // Enviar aviso de fila na conversa selecionada
  const sendQueueNotice = async () => {
    if (!selectedConversation) return;
    const { error } = await supabase.from('agent_messages').insert({
      conversation_id: selectedConversation.id,
      role: 'agent',
      content: queueMessage,
      sender_name: senderName || 'Atendimento',
    });

    if (error) {
      toast({ title: "Erro", description: "Não foi possível enviar o aviso de fila", variant: "destructive" });
    } else {
      toast({ title: "Aviso enviado", description: "O cliente foi informado sobre a fila de espera." });
      loadMessages(selectedConversation.id);
    }
  };

  // Atualizar nome do atendente quando mudar
  const handleSenderNameChange = (name: string) => {
    setSenderName(name);
    localStorage.setItem(`agent_sender_name_${agentId}`, name);
    
    // Atualizar no banco também
    supabase
      .from('ai_agents')
      .update({ attendant_name: name || null })
      .eq('id', agentId)
      .then();
  };


  useEffect(() => {
    loadConversations();
    const channel = setupConversationsSubscription();
    const presenceChannel = setupPresenceTracking();
    return () => {
      supabase.removeChannel(channel);
      if (presenceChannel) {
        supabase.removeChannel(presenceChannel);
      }
    };
  }, [agentId]);

  useEffect(() => {
    if (selectedConversation) {
      const conversationId = selectedConversation.id;
      
      // Carregar mensagens iniciais
      loadMessages(conversationId);
      
      // Configurar subscription em tempo real
      const channel = supabase
        .channel(`agent-messages-realtime-${conversationId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'agent_messages',
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload) => {
            console.log('📩 Nova mensagem recebida no painel:', payload);
            // Adicionar nova mensagem diretamente ao estado
            const newMessage = payload.new as any;
            
            // Tocar som de notificação se for mensagem do cliente
            if (newMessage.role === 'customer') {
              chatSounds.playNotificationSound();
            }
            
            setMessages(prev => {
              // Evitar duplicação
              const exists = prev.some(m => m.id === newMessage.id);
              if (exists) return prev;
              return [...prev, newMessage];
            });
          }
        )
        .subscribe((status) => {
          console.log('📡 Status da subscription de mensagens:', status);
        });
      
      // Polling de backup a cada 5 segundos para garantir sincronização
      const pollingInterval = setInterval(() => {
        loadMessages(conversationId);
      }, 5000);
      
      return () => {
        supabase.removeChannel(channel);
        clearInterval(pollingInterval);
      };
    }
  }, [selectedConversation?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        setTimeout(() => {
          viewport.scrollTop = viewport.scrollHeight;
        }, 100);
      }
    }
  };

  const loadConversations = async () => {
    const { data, error } = await supabase
      .from('agent_conversations')
      .select(`
        *,
        agent_customers (
          id,
          name,
          email
        )
      `)
      .eq('agent_id', agentId)
      .order('last_message_at', { ascending: false });

    if (error) {
      toast({
        title: "Erro ao carregar conversas",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setConversations(data || []);
      setFilteredConversations(data || []);
      
      // Contar notificações não lidas
      await loadUnreadCount();
    }
    setLoading(false);
  };

  const loadUnreadCount = async () => {
    let totalUnread = 0;

    // Para cada conversa ativa, contar mensagens não lidas
    for (const conv of conversations) {
      if (conv.status !== 'active') continue;

      const { data: messages } = await supabase
        .from('agent_messages')
        .select('role')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (messages && messages.length > 0) {
        const lastAgentIndex = messages.findIndex(m => m.role === 'agent');
        
        let unreadForConv = 0;
        if (lastAgentIndex === -1) {
          unreadForConv = messages.filter(m => m.role === 'customer').length;
        } else {
          unreadForConv = messages.slice(0, lastAgentIndex).filter(m => m.role === 'customer').length;
        }
        
        totalUnread += unreadForConv;
      }
    }
    
    setUnreadCount(totalUnread);
  };

  const loadMessages = async (conversationId: string) => {
    const { data } = await supabase
      .from('agent_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    setMessages(data || []);
  };

  useEffect(() => {
    if (searchTerm) {
      const filtered = conversations.filter(conv =>
        conv.agent_customers.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.agent_customers.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredConversations(filtered);
    } else {
      setFilteredConversations(conversations);
    }
  }, [searchTerm, conversations]);

  const setupConversationsSubscription = () => {
    const channel = supabase
      .channel(`agent-conversations-panel-${agentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agent_conversations',
          filter: `agent_id=eq.${agentId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            chatSounds.playNotificationSound();
            toast({
              title: "Nova conversa",
              description: "Um cliente iniciou um atendimento no chat online.",
            });
          }
          loadConversations();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_messages',
        },
        () => {
          loadConversations();
        }
      )
      .subscribe((status) => {
        console.log('📡 Conversas realtime:', status);
      });

    return channel;
  };

  const setupPresenceTracking = () => {
    if (!agentId) return null;

    console.log('🎯 Painel do agente - Configurando rastreamento de presença para agentId:', agentId);

    const channel = supabase.channel(`agent-conversations-${agentId}`);

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const onlineIds = new Set<string>();
        
        console.log('🔄 Painel - Estado de presença sincronizado:', state);
        
        Object.values(state).forEach((presences: any) => {
          presences.forEach((presence: any) => {
            if (presence.customer_id) {
              onlineIds.add(presence.customer_id);
              console.log('✅ Painel - Cliente online detectado:', {
                customerId: presence.customer_id,
                customerName: presence.customer_name,
                conversationId: presence.conversation_id
              });
            }
          });
        });
        
        console.log('📊 Painel - Total de clientes online:', onlineIds.size, Array.from(onlineIds));
        setOnlineCustomers(onlineIds);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('🟢 Painel - Cliente entrou no chat:', key, newPresences);
        newPresences.forEach((presence: any) => {
          if (presence.customer_id) {
            console.log('➕ Adicionando cliente online:', presence.customer_id);
            setOnlineCustomers(prev => {
              const newSet = new Set([...prev, presence.customer_id]);
              console.log('📊 Clientes online após join:', Array.from(newSet));
              return newSet;
            });
          }
        });
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('🔴 Painel - Cliente saiu do chat:', key, leftPresences);
        leftPresences.forEach((presence: any) => {
          if (presence.customer_id) {
            console.log('➖ Removendo cliente online:', presence.customer_id);
            setOnlineCustomers(prev => {
              const newSet = new Set(prev);
              newSet.delete(presence.customer_id);
              console.log('📊 Clientes online após leave:', Array.from(newSet));
              return newSet;
            });
          }
        });
      })
      .subscribe((status) => {
        console.log('📡 Painel - Status da subscrição:', status);
      });

    return channel;
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

  const onEmojiSelect = (emoji: any) => {
    setNewMessage(newMessage + emoji.native);
    setShowEmojiPicker(false);
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !selectedImage && !selectedDocument) || !selectedConversation) return;
    if (!senderName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, digite seu nome antes de enviar.",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploadingMedia(true);
      // Salvar nome no localStorage
      localStorage.setItem(`agent_sender_name_${agentId}`, senderName);

      let mediaUrl = null;
      let mediaType = null;

      // Upload image or document if selected
      if (selectedImage) {
        mediaUrl = await uploadFile(selectedImage, 'image');
        mediaType = 'image';
      } else if (selectedDocument) {
        mediaUrl = await uploadFile(selectedDocument, 'document');
        mediaType = 'document';
      }

      // Adicionar mensagem otimisticamente à UI
      const tempMessage = {
        id: `temp-${Date.now()}`,
        conversation_id: selectedConversation.id,
        role: 'agent',
        content: newMessage || (mediaType === 'image' ? '📷 Imagem' : '📄 Documento'),
        sender_name: senderName,
        media_url: mediaUrl,
        media_type: mediaType,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, tempMessage]);

      // Limpar campos imediatamente após adicionar à UI
      const messageToSend = newMessage;
      setNewMessage("");
      setSelectedImage(null);
      setSelectedDocument(null);
      setImagePreview(null);

      // Inserir mensagem do atendente humano
      const { error: msgError } = await supabase
        .from('agent_messages')
        .insert({
          conversation_id: selectedConversation.id,
          role: 'agent',
          content: messageToSend || (mediaType === 'image' ? '📷 Imagem' : '📄 Documento'),
          sender_name: senderName,
          media_url: mediaUrl,
          media_type: mediaType,
        });

      if (msgError) throw msgError;

      // Recarregar mensagens após insert para obter IDs corretos
      await loadMessages(selectedConversation.id);

      // Scroll automático após enviar
      scrollToBottom();

      toast({
        title: "Mensagem enviada",
      });
    } catch (error: any) {
      // Em caso de erro, recarregar mensagens para remover a temporária
      if (selectedConversation) {
        loadMessages(selectedConversation.id);
      }
      toast({
        title: "Erro ao enviar mensagem",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploadingMedia(false);
    }
  };

  const updateStatus = async (status: string) => {
    if (!selectedConversation) return;

    const { error } = await supabase
      .from('agent_conversations')
      .update({ status })
      .eq('id', selectedConversation.id);

    if (error) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Status atualizado!",
      });
      loadConversations();
      setSelectedConversation({ ...selectedConversation, status });
    }
  };

  const handleDeleteConversation = async () => {
    if (!conversationToDelete) return;

    try {
      // Deletar mensagens primeiro
      await supabase
        .from('agent_messages')
        .delete()
        .eq('conversation_id', conversationToDelete);

      // Deletar conversa
      const { error } = await supabase
        .from('agent_conversations')
        .delete()
        .eq('id', conversationToDelete);

      if (error) throw error;

      if (selectedConversation?.id === conversationToDelete) {
        setSelectedConversation(null);
      }
      
      loadConversations();
      setDeleteDialogOpen(false);
      setConversationToDelete(null);
      
      toast({
        title: "Conversa excluída",
        description: "A conversa foi excluída com sucesso.",
      });
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast({
        title: "Erro ao excluir conversa",
        description: "Não foi possível excluir a conversa.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div>Carregando conversas...</div>;
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-2xl font-bold">Conversas</h3>
          <div className="flex items-center gap-3 flex-wrap">

            
            {unreadCount > 0 && (
              <Badge variant="destructive" className="rounded-full">
                {unreadCount} novas
              </Badge>
            )}
            <Badge variant="outline">{conversations.length} total</Badge>
          </div>
        </div>

        {/* Painel do atendente */}
        <Card>
          <CardContent className="p-4 grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-xs">Nome do atendente</Label>
              <Input
                value={senderName}
                onChange={(e) => handleSenderNameChange(e.target.value)}
                placeholder="Ex: Ana - Suporte"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Status do atendente</Label>
              <Select value={attendantStatus} onValueChange={(v) => updateAttendantStatus(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="busy">Ocupado</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Fila de espera</Label>
                <Switch
                  checked={queueEnabled}
                  onCheckedChange={(checked) => {
                    setQueueEnabled(checked);
                    saveQueueSettings(checked, queueMessage);
                  }}
                />
              </div>
              <Textarea
                value={queueMessage}
                onChange={(e) => setQueueMessage(e.target.value)}
                onBlur={() => saveQueueSettings(queueEnabled, queueMessage)}
                rows={2}
                placeholder="Mensagem exibida ao cliente na fila"
              />

              {queueEnabled && (
                <div className="space-y-2 rounded-md border border-border p-2">
                  <Label className="text-xs">Pessoas na fila antes dos chats</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => {
                        const next = Math.max(0, queueAhead - 1);
                        setQueueAhead(next);
                        saveQueueSettings(queueEnabled, queueMessage, next, true);
                      }}
                    >
                      -
                    </Button>
                    <Input
                      type="number"
                      min={0}
                      value={queueAhead}
                      onChange={(e) => setQueueAhead(Math.max(0, Number(e.target.value) || 0))}
                      onBlur={() => saveQueueSettings(queueEnabled, queueMessage, queueAhead, true)}
                      className="h-8 text-center"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => {
                        const next = queueAhead + 1;
                        setQueueAhead(next);
                        saveQueueSettings(queueEnabled, queueMessage, next, true);
                      }}
                    >
                      +
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Aguardando agora: {Math.max(queueAhead, ...conversations.map((c) => c.queue_position ?? 0), 0)} na maior posição •{' '}
                    {conversations.filter((c) => (c.queue_position ?? 0) > 0).length} chat(s) em espera. Quem entrar agora será o nº{' '}
                    {Math.max(queueAhead, ...conversations.map((c) => c.queue_position ?? 0), 0) + 1}.
                  </p>
                  <Label className="text-xs">Tempo estimado de atendimento (minutos)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={queueEtaMinutes}
                    onChange={(e) => setQueueEtaMinutes(Math.max(0, Number(e.target.value) || 0))}
                    onBlur={() => saveQueueSettings(queueEnabled, queueMessage, queueAhead, true, queueEtaMinutes)}
                    className="h-8"
                    placeholder="0 = não exibir"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <Button type="button" size="sm" onClick={callNextInQueue}>
                      Chamar próximo
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={resetQueue}>
                      Zerar fila
                    </Button>
                  </div>
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                disabled={!selectedConversation}
                onClick={sendQueueNotice}
              >
                Enviar aviso de fila no chat
              </Button>
            </div>


            <div className="space-y-2 md:col-span-3">
              <Label className="text-xs">Cores dos status no chat</Label>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { key: 'online' as const, label: 'Online' },
                  { key: 'busy' as const, label: 'Ocupado' },
                  { key: 'offline' as const, label: 'Offline' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center gap-2 rounded-md border border-border p-2">
                    <input
                      type="color"
                      value={statusColors[item.key]}
                      onChange={(e) => updateStatusColor(item.key, e.target.value)}
                      className="h-9 w-10 rounded border border-border cursor-pointer"
                      aria-label={`Cor do status ${item.label}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium">{item.label}</p>
                      <Input
                        value={statusColors[item.key]}
                        onChange={(e) => updateStatusColor(item.key, e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2 md:col-span-3">
              <Label className="text-xs">Contato por e-mail (tela inicial quando offline/ocupado e dentro do chat)</Label>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  value={contactEmailButtonText}
                  onChange={(e) => setContactEmailButtonText(e.target.value)}
                  onBlur={saveContactEmailSettings}
                  placeholder="Texto do botão"
                />
                <Textarea
                  value={contactEmailMessage}
                  onChange={(e) => setContactEmailMessage(e.target.value)}
                  onBlur={saveContactEmailSettings}
                  rows={2}
                  placeholder="Mensagem exibida no chat"
                />
                <div className="sm:col-span-2 space-y-1">
                  <Label className="text-xs">Mensagem de confirmação após o envio do formulário</Label>
                  <Textarea
                    value={contactEmailSuccessMessage}
                    onChange={(e) => setContactEmailSuccessMessage(e.target.value)}
                    onBlur={saveContactEmailSettings}
                    rows={2}
                    placeholder="Sua mensagem foi enviada! Vamos te retornar por e-mail em breve."
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>



      <div className="grid gap-4 md:grid-cols-3">
        {/* Lista de conversas */}
        <div className="md:col-span-1 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar conversas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <ScrollArea className="h-[600px]">
            <div className="space-y-2">
              {filteredConversations.map((conv) => (
                <Card
                  key={conv.id}
                  className={`cursor-pointer transition-all ${
                    selectedConversation?.id === conv.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={async () => {
                    setSelectedConversation(conv);
                    await loadUnreadCount();
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <User className="w-4 h-4" />
                          {onlineCustomers.has(conv.agent_customers.id) && (
                            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-background rounded-full" />
                          )}
                        </div>
                        <div>
                          {/* Status indicator above name */}
                          <div className="mb-0.5">
                            {onlineCustomers.has(conv.agent_customers.id) ? (
                              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                                ● Online
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400">
                                ○ Offline
                              </Badge>
                            )}
                          </div>
                          <div className="font-medium text-sm">
                            {conv.agent_customers.name}
                          </div>
                          <div className="text-xs text-muted-foreground">{conv.agent_customers.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={conv.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                          {conv.status === 'active' ? 'Ativa' : conv.status === 'closed' ? 'Fechada' : conv.status}
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConversationToDelete(conv.id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      {format(new Date(conv.last_message_at), "dd/MM HH:mm", { locale: ptBR })}
                    </div>

                    {queueEnabled && (
                      <div
                        className="mt-2 flex items-center gap-1.5 border-t border-border pt-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="text-[11px] text-muted-foreground shrink-0">Fila nº</span>
                        <Input
                          type="number"
                          min={0}
                          value={conv.queue_position ?? ''}
                          placeholder="-"
                          onChange={(e) => {
                            const v = e.target.value === '' ? null : Math.max(0, Number(e.target.value) || 0);
                            setConversations((prev) => prev.map((c) => (c.id === conv.id ? { ...c, queue_position: v } : c)));
                          }}
                          onBlur={(e) => {
                            const v = e.target.value === '' ? null : Math.max(0, Number(e.target.value) || 0);
                            setConversationQueuePosition(conv.id, v);
                          }}
                          className="h-7 w-16 text-center text-xs"
                        />
                        {(conv.queue_position ?? 0) > 0 ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[11px] px-2"
                            onClick={() => setConversationQueuePosition(conv.id, 0)}
                          >
                            Atender
                          </Button>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">
                            {conv.queue_position === 0 ? 'É a vez dele' : 'Sem fila'}
                          </Badge>
                        )}
                      </div>
                    )}

                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Área de mensagens */}
        <div className="md:col-span-2">
          {selectedConversation ? (
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <User className="w-5 h-5" />
                      {onlineCustomers.has(selectedConversation.agent_customers.id) && (
                        <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-background rounded-full animate-pulse" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {selectedConversation.agent_customers.name}
                        {onlineCustomers.has(selectedConversation.agent_customers.id) && (
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                            Online
                          </Badge>
                        )}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{selectedConversation.agent_customers.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">


                    <Select value={selectedConversation.status} onValueChange={updateStatus}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Ativa</SelectItem>
                        <SelectItem value="closed">Fechada</SelectItem>
                        <SelectItem value="resolved">Resolvida</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>

              <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((msg) => {
                    // Mensagens do sistema (notificações automáticas)
                    if (msg.role === 'assistant' || msg.sender_name === 'Sistema') {
                      return (
                        <div key={msg.id} className="flex justify-center">
                          <div className="max-w-[85%] rounded-lg p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">Sistema</Badge>
                            </div>
                            <p className="whitespace-pre-wrap text-sm">{linkifyText(msg.content)}</p>
                            <span className="text-xs opacity-70 mt-1 block">
                              {format(new Date(msg.created_at), "HH:mm", { locale: ptBR })}
                            </span>
                          </div>
                        </div>
                      );
                    }
                    
                    // Mensagens normais (cliente ou agente)
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${msg.role === 'customer' ? 'justify-start' : 'justify-end'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            msg.role === 'customer'
                              ? 'bg-muted'
                              : 'bg-primary text-primary-foreground'
                          }`}
                        >
                          {msg.media_url && msg.media_type === 'image' && (
                            <img 
                              src={msg.media_url} 
                              alt="Imagem enviada" 
                              className="max-w-full rounded mb-2 max-h-64 object-contain"
                            />
                          )}
                          {msg.media_url && msg.media_type === 'document' && (
                            <a 
                              href={msg.media_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm underline mb-2"
                            >
                              <FileText className="w-4 h-4" />
                              Ver documento
                            </a>
                          )}
                          <p className="whitespace-pre-wrap">{linkifyText(msg.content)}</p>
                          <span className="text-xs opacity-70 mt-1 block">
                            {format(new Date(msg.created_at), "HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <div className="p-4 border-t">
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

                <div className="flex gap-2 mb-2">
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
                  
                  <Input
                    placeholder="Seu nome"
                    value={senderName}
                    onChange={(e) => handleSenderNameChange(e.target.value)}
                    className="w-[200px]"
                  />
                </div>
                
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!uploadingMedia && (newMessage.trim() || selectedImage || selectedDocument)) {
                      handleSendMessage();
                    }
                  }}
                  className="flex gap-2"
                >
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
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if ((e.key === 'Enter' || e.key === 'NumpadEnter') && !e.shiftKey) {
                        e.preventDefault();
                        if (!uploadingMedia && (newMessage.trim() || selectedImage || selectedDocument)) {
                          handleSendMessage();
                        }
                      }
                    }}
                    placeholder="Digite sua mensagem..."
                    className="flex-1"
                    disabled={uploadingMedia}
                  />
                  <Button 
                    type="submit"
                    disabled={uploadingMedia || (!newMessage.trim() && !selectedImage && !selectedDocument)}
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </form>
              </div>
            </Card>
          ) : (
            <Card className="h-[600px] flex items-center justify-center">
              <CardContent className="text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Selecione uma conversa para visualizar</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>

    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir conversa?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita. Todas as mensagens desta conversa serão excluídas permanentemente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDeleteConversation} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>
  );
}