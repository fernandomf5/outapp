import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Send, LogOut, Smile, ImagePlus, X, FileText } from "lucide-react";
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { chatSounds } from "@/utils/chatSounds";
import { linkifyText } from "@/utils/linkify";

interface Message {
  id: string;
  role: 'user' | 'bot' | 'assistant' | 'admin';
  content: string;
  created_at: string;
  sender_name?: string;
  media_url?: string | null;
  media_type?: string | null;
  node_id?: string | null;
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
  const inputRef = useRef<HTMLInputElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const [isAdminTyping, setIsAdminTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [autoReplySent, setAutoReplySent] = useState(false);

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
          // Acesso anônimo - criar sessão temporária e persistir
          const tempCustomer = {
            id: crypto.randomUUID(),
            name: 'Visitante',
            email: `anon_${Date.now()}@temp.com`,
          };
          setCustomer(tempCustomer);
          try {
            localStorage.setItem(`chatbot_customer_${chatbotId}`, JSON.stringify(tempCustomer));
          } catch (_) {}
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
      const presenceCleanup = setupPresenceTracking();

      // Polling fallback: refresh messages periodically (helps on mobile if realtime misses)
      const pollInterval = setInterval(() => {
        loadMessages(conversationId);
      }, 4000);

      return () => {
        cleanup();
        presenceCleanup();
        clearInterval(pollInterval);
      };
    }
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadChatbotAndConversation = async (customerId: string, customerData?: any) => {
    try {
      // Load chatbot info
      const { data: chatbot } = await supabase
        .from('chatbots')
        .select('*')
        .eq('id', chatbotId)
        .single();

      setChatbotInfo(chatbot);

      // Verificar se é um usuário anônimo (email temporário)
      const isAnonymous = customerData?.email?.includes('anon_') || !customerData?.email;

      let conversationToUse;

      // Apenas clientes autenticados (não-anônimos) reutilizam conversas
      if (!isAnonymous && customerData?.email) {
        // Verificar se existe conversa salva no localStorage primeiro
        const savedConversationId = localStorage.getItem(`chatbot_conversation_${chatbotId}_${customerData.email}`);
        
        if (savedConversationId) {
          // Verificar se a conversa ainda existe no banco
          const { data: savedConv } = await supabase
            .from('chatbot_conversations')
            .select('*')
            .eq('id', savedConversationId)
            .eq('chatbot_id', chatbotId)
            .maybeSingle();
          
          if (savedConv) {
            conversationToUse = savedConv;
            
            // Atualizar última atividade
            await supabase
              .from('chatbot_conversations')
              .update({ 
                last_message_at: new Date().toISOString(),
                visitor_name: customerData?.name || savedConv.visitor_name,
                visitor_phone: customerData?.phone || savedConv.visitor_phone,
              })
              .eq('id', savedConv.id);

            setConversationId(savedConv.id);
            await loadMessages(savedConv.id);
            return;
          }
        }
        
        // Se não tem no localStorage, buscar conversa existente baseada no email
        const { data: conversations } = await supabase
          .from('chatbot_conversations')
          .select('*')
          .eq('chatbot_id', chatbotId)
          .eq('visitor_email', customerData.email)
          .eq('status', 'active')
          .order('last_message_at', { ascending: false })
          .limit(1);

        if (conversations && conversations.length > 0) {
          conversationToUse = conversations[0];
          
          // Salvar no localStorage para próximas vezes
          localStorage.setItem(`chatbot_conversation_${chatbotId}_${customerData.email}`, conversationToUse.id);
          
          // Atualizar última atividade
          await supabase
            .from('chatbot_conversations')
            .update({ 
              last_message_at: new Date().toISOString(),
              visitor_name: customerData?.name || conversationToUse.visitor_name,
              visitor_phone: customerData?.phone || conversationToUse.visitor_phone,
            })
            .eq('id', conversationToUse.id);

          setConversationId(conversationToUse.id);
          await loadMessages(conversationToUse.id);
          return;
        }
      }

      // Criar nova conversa (para anônimos sempre, para autenticados se não existir)
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const { data: created, error: createErr } = await supabase.functions.invoke('create-chatbot-conversation', {
        body: {
          chatbotId,
          sessionId,
          visitorEmail: customerData?.email || null,
          visitorName: customerData?.name || null,
          visitorPhone: customerData?.phone || null,
        }
      });

      if (createErr || !created?.conversationId) {
        throw createErr || new Error('Falha ao criar conversa');
      }

      conversationToUse = { id: created.conversationId } as any;

      // Create notification para novas conversas
      await supabase
        .from('chatbot_notifications')
        .insert({
          chatbot_id: chatbotId,
          type: 'new_conversation',
          title: 'Nova Conversa',
          message: `${customerData?.name || 'Visitante'} iniciou uma conversa`,
          is_read: false,
        });

      setConversationId(conversationToUse.id);
      
      // Salvar conversationId no localStorage para clientes autenticados
      if (!isAnonymous && customerData?.email) {
        localStorage.setItem(`chatbot_conversation_${chatbotId}_${customerData.email}`, conversationToUse.id);
      }
      
      await loadMessages(conversationToUse.id);
    } catch (error) {
      console.error('Error loading chatbot:', error);
      // Evitar mensagem de fallback; mostrar alerta discreto e permitir tentar novamente
      toast({
        title: 'Não foi possível iniciar o chat',
        description: 'Por favor, tente novamente em instantes.',
        variant: 'destructive',
      });
    }
  };

  const loadMessages = async (convId: string) => {
    const { data, error } = await supabase
      .from('chatbot_messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Erro ao carregar mensagens:', error);
      return; // não sobrescreve as mensagens locais (otimistas)
    }
    if (!data) return;

    // Mesclar mantendo mensagens otimistas e evitando duplicatas por id
    setMessages((prev) => {
      const byId = new Map<string, Message>();
      [...prev, ...data as any].forEach((m: any) => byId.set(m.id, m as Message));
      return Array.from(byId.values()).sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    });
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`chatbot-conversation-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chatbot_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => {
            // Evitar duplicatas
            const exists = prev.some(m => m.id === newMessage.id);
            if (exists) return prev;
            
            // Tocar som para mensagens do bot/atendente/admin
            if (newMessage.role === 'assistant' || newMessage.role === 'bot' || newMessage.role === 'admin') {
              chatSounds.playReceiveSound();
            }
            
            return [...prev, newMessage];
          });
        }
      )
      .on('broadcast', { event: 'admin-typing' }, (payload) => {
        if (payload.payload.conversationId === conversationId) {
          setIsAdminTyping(payload.payload.isTyping);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const setupPresenceTracking = () => {
    const presenceChannel = supabase
      .channel(`presence-${conversationId}`)
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        console.log('👥 Estado de presença:', state);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            user: 'visitor',
            online_at: new Date().toISOString(),
          });
        }
      });

    // Enviar status de online ao sair da página
    const handleBeforeUnload = async () => {
      await presenceChannel.untrack();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      presenceChannel.untrack();
      window.removeEventListener('beforeunload', handleBeforeUnload);
      supabase.removeChannel(presenceChannel);
    };
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "O tamanho máximo é 5MB",
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
      .from('chatbot-media')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('chatbot-media')
      .getPublicUrl(filePath);

    return publicUrl;
  };

const handleSendMessage = async () => {
    if ((!input.trim() && !selectedImage && !selectedDocument) || !conversationId || loading) return;

    setLoading(true);
    try {
      setUploadingImage(true);
      let mediaUrl = null;
      let mediaType = null;

      if (selectedImage) {
        mediaUrl = await uploadFile(selectedImage, 'image');
        mediaType = 'image';
      } else if (selectedDocument) {
        mediaUrl = await uploadFile(selectedDocument, 'document');
        mediaType = 'document';
      }

      const messageContent = input.trim() || (mediaType === 'image' ? '📷 Imagem' : '📄 Documento');

      // Otimista: mostrar imediatamente no cliente
      const tempId = `temp-${Date.now()}`;
      const optimisticMsg: Message = {
        id: tempId,
        role: 'user',
        content: messageContent,
        created_at: new Date().toISOString(),
        sender_name: customer?.name || 'Você',
        media_url: mediaUrl,
        media_type: mediaType as any,
      };
      setMessages(prev => [...prev, optimisticMsg]);

      // Enviar mensagem via Edge Function (bypass RLS)
      const { error } = await supabase.functions.invoke('chatbot-customer-message', {
        body: {
          chatbotId,
          conversationId,
          content: messageContent,
          senderName: customer?.name || 'Você',
          mediaUrl,
          mediaType,
        }
      });

      if (error) throw error;

      // Remover mensagem otimística após confirmação do servidor
      setMessages(prev => prev.filter(m => m.id !== tempId));

      // Sincronizar mensagens para garantir exibição imediata (fallback ao realtime)
      await loadMessages(conversationId);

      // Enviar mensagem automática na primeira mensagem do cliente
      if (!autoReplySent && chatbotInfo?.enable_auto_reply && chatbotInfo?.auto_reply_message?.trim()) {
        setAutoReplySent(true);
        setTimeout(async () => {
          await supabase
            .from('chatbot_messages')
            .insert({
              conversation_id: conversationId,
              role: 'admin',
              content: chatbotInfo.auto_reply_message,
              sender_name: chatbotInfo?.name || 'Atendente',
            });
          await supabase
            .from('chatbot_conversations')
            .update({ last_message_at: new Date().toISOString() })
            .eq('id', conversationId);
        }, 1000);
      }

      // Tocar som de envio
      chatSounds.playSendSound();

      setInput("");
      setSelectedImage(null);
      setSelectedDocument(null);
      setImagePreview(null);
      
      // Foco de volta no input após enviar
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Erro ao enviar mensagem",
        description: "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setUploadingImage(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(`chatbot_customer_${chatbotId}`);
    navigate(`/chatbot-auth/${chatbotId}`);
  };

  const onEmojiSelect = (emoji: any) => {
    setInput(prev => prev + emoji.native);
    setShowEmojiPicker(false);
  };

  if (!customer || !chatbotInfo) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-primary/5 to-background">
      {/* Header */}
      <div className="bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{chatbotInfo.name}</h1>
              <p className="text-sm text-muted-foreground">
                Olá, {customer?.name || 'Visitante'}!
              </p>
              {isAdminTyping && (
                <p className="text-xs text-primary animate-pulse">
                  Atendente está digitando...
                </p>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        <div className="container mx-auto max-w-4xl space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Envie uma mensagem para começar a conversa
              </p>
            </div>
          )}
          
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <Card
                className={`max-w-[70%] p-4 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card'
                }`}
              >
                {message.sender_name && message.role !== 'user' && (
                  <p className="text-xs font-semibold mb-1 text-muted-foreground">
                    {message.sender_name}
                  </p>
                )}
                 {message.media_url && message.media_type === 'image' && (
                   <img 
                     src={message.media_url} 
                     alt="Imagem enviada" 
                     className="rounded-lg mb-2 max-w-full h-auto"
                   />
                 )}
                 {message.media_url && message.media_type === 'document' && (
                   <div className="mb-2 p-2 bg-muted rounded border">
                     <a
                       href={message.media_url}
                       target="_blank"
                       rel="noreferrer"
                       className="flex items-center gap-2 text-sm hover:underline"
                     >
                       <FileText className="w-4 h-4" />
                       <span>Abrir documento</span>
                     </a>
                   </div>
                 )}
                 <p className="whitespace-pre-wrap break-words">{linkifyText(message.content)}</p>
                 <p
                   className={`text-xs mt-2 ${
                     message.role === 'user'
                       ? 'text-primary-foreground/70'
                       : 'text-muted-foreground'
                   }`}
                 >
                   {new Date(message.created_at).toLocaleTimeString('pt-BR', {
                     hour: '2-digit',
                     minute: '2-digit',
                   })}
                 </p>
               </Card>
             </div>
           ))}
           <div ref={messagesEndRef} />
         </div>
       </ScrollArea>

      {/* Input Area */}
      <div className="bg-card border-t p-4">
        <div className="container mx-auto max-w-4xl">
          {imagePreview && (
            <div className="mb-2 relative inline-block">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="h-20 rounded-lg"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6"
                onClick={() => {
                  setSelectedImage(null);
                  setImagePreview(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {selectedDocument && (
            <div className="mb-2 p-2 bg-muted rounded-lg border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span className="text-sm">{selectedDocument.name}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
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
                if (!loading && !uploadingImage && (input.trim() || selectedImage || selectedDocument)) {
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
                accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx"
                className="hidden"
                onChange={handleDocumentSelect}
              />
              
              <Button
                variant="outline"
                size="icon"
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                title="Enviar imagem"
              >
                <ImagePlus className="w-4 h-4" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                type="button"
                onClick={() => docInputRef.current?.click()}
                disabled={uploadingImage}
                title="Enviar documento"
              >
                <FileText className="w-4 h-4" />
              </Button>

              <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Smile className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0 border-0" align="start">
                  <Picker
                    data={data}
                    onEmojiSelect={onEmojiSelect}
                    theme="light"
                    locale="pt"
                  />
                </PopoverContent>
              </Popover>

              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  if (e.target.value.length > input.length) {
                    chatSounds.playTypingSound();
                  }
                }}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === 'NumpadEnter') && !e.shiftKey) {
                    e.preventDefault();
                    if (!loading && !uploadingImage && (input.trim() || selectedImage || selectedDocument)) {
                      handleSendMessage();
                    }
                  }
                }}
                placeholder="Digite sua mensagem..."
                disabled={loading || uploadingImage}
                className="flex-1"
              />
              <Button 
                type="submit"
                disabled={loading || uploadingImage || (!input.trim() && !selectedImage && !selectedDocument)}
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
        </div>
      </div>
    </div>
  );
}
