import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Search, User, Send, Trash2, Smile, ImagePlus, FileText, X, RefreshCw } from "lucide-react";
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { linkifyText } from "@/utils/linkify";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { chatSounds } from "@/utils/chatSounds";

interface Conversation {
  id: string;
  status: string;
  created_at: string;
  last_message_at: string;
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
        .select('attendant_status, attendant_name')
        .eq('id', agentId)
        .single();
      
      if (agent) {
        setAttendantStatus((agent.attendant_status as 'online' | 'offline' | 'busy') || 'offline');
        if (agent.attendant_name && !savedName) {
          setSenderName(agent.attendant_name);
        }
      }
    };
    
    loadAttendantStatus();
  }, [agentId]);

  // Função para atualizar status do atendente
  const updateAttendantStatus = async (status: 'online' | 'offline' | 'busy') => {
    setAttendantStatus(status);
    
    // Buscar config atual do agente
    const { data: agentData } = await supabase
      .from('ai_agents')
      .select('config')
      .eq('id', agentId)
      .single();
    
    const currentConfig = agentData?.config as any || {};
    
    // Se o atendente entrar online, desabilitamos fluxos para assumir manual
    // Se entrar offline, reabilitamos fluxos
    const flowsEnabled = status === 'offline';

    const { error } = await supabase
      .from('ai_agents')
      .update({ 
        attendant_status: status,
        attendant_name: senderName || null,
        config: { ...currentConfig, flows_enabled: flowsEnabled }
      })
      .eq('id', agentId);
    
    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Status atualizado",
        description: `Você está ${status === 'online' ? 'Online' : status === 'busy' ? 'Em Atendimento' : 'Offline'}. Fluxos automáticos: ${flowsEnabled ? 'Ativados' : 'Pausados'}.`,
      });
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
      .channel('agent-conversations-panel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agent_conversations',
          filter: `agent_id=eq.${agentId}`,
        },
        () => {
          loadConversations();
        }
      )
      .subscribe();

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

  const handleRestartConversation = async () => {
    if (!selectedConversation) return;

    try {
      setLoading(true);
      // Arquivar conversa atual
      const { error: archiveError } = await supabase
        .from('agent_conversations')
        .update({ status: 'archived' })
        .eq('id', selectedConversation.id);

      if (archiveError) throw archiveError;

      // Criar nova conversa
      const { data: newConv, error: createError } = await supabase
        .from('agent_conversations')
        .insert({
          agent_id: agentId,
          customer_id: selectedConversation.agent_customers.id,
          status: 'active',
          ai_enabled: true,
          last_message_at: new Date().toISOString(),
        })
        .select(`
          *,
          agent_customers (
            id,
            name,
            email
          )
        `)
        .single();

      if (createError) throw createError;

      // Disparar gatilho inicial
      const supabaseUrl = (supabase as any).supabaseUrl;
      const processUrl = `${supabaseUrl}/functions/v1/process-agent-customer-message`;
      
      // Obter a chave anon do localStorage ou config (o browser geralmente tem acesso via client)
      // Como estamos no frontend, usamos o client.invoke ou fetch direto
      await supabase.functions.invoke('process-agent-customer-message', {
        body: {
          agentId,
          customerId: selectedConversation.agent_customers.id,
          conversationId: newConv.id,
          message: '' // Gatilho inicial
        }
      });

      setSelectedConversation(newConv as Conversation);
      loadConversations();
      
      toast({
        title: "Chat reiniciado",
        description: "A conversa foi arquivada e um novo fluxo foi iniciado para o cliente.",
      });
    } catch (error: any) {
      console.error('Error restarting conversation:', error);
      toast({
        title: "Erro ao reiniciar chat",
        description: error.message || "Não foi possível reiniciar a conversa.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
            {/* Status do Atendente */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Seu status:</span>
              <Select value={attendantStatus} onValueChange={(v) => updateAttendantStatus(v as 'online' | 'offline' | 'busy')}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      Online
                    </div>
                  </SelectItem>
                  <SelectItem value="busy">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-yellow-500" />
                      Em Atendimento
                    </div>
                  </SelectItem>
                  <SelectItem value="offline">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-gray-400" />
                      Offline
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {unreadCount > 0 && (
              <Badge variant="destructive" className="rounded-full">
                {unreadCount} novas
              </Badge>
            )}
            <Badge variant="outline">{conversations.length} total</Badge>
          </div>
        </div>

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
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleRestartConversation(selectedConversation.id)}
                      className="gap-2 border-primary text-primary hover:bg-primary hover:text-white transition-all shadow-sm font-bold"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Reiniciar Fluxo
                    </Button>

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