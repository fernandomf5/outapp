import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Send, LogOut, Smile, ImagePlus, X } from "lucide-react";
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { chatSounds } from "@/utils/chatSounds";
import { linkifyText } from "@/utils/linkify";

interface Message {
  id: string;
  role: 'user' | 'bot' | 'assistant';
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
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
      return () => {
        cleanup();
        presenceCleanup();
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
        await loadMessages(activeConv.id);
      } else {
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
        description: "Não foi possível carregar o chat",
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
            const exists = prev.some(m => m.id === newMessage.id);
            if (!exists && (newMessage.role === 'assistant' || newMessage.role === 'bot')) {
              chatSounds.playReceiveSound();
            }
            return exists ? prev : [...prev, newMessage];
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

  const uploadImage = async (): Promise<string | null> => {
    if (!selectedImage) return null;

    setUploadingImage(true);
    try {
      const fileExt = selectedImage.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `chatbot-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('chatbot-media')
        .upload(filePath, selectedImage);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('chatbot-media')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Erro ao enviar imagem",
        description: "Tente novamente",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

const handleSendMessage = async () => {
    if ((!input.trim() && !selectedImage) || !conversationId || loading) return;

    setLoading(true);
    try {
      let mediaUrl = null;
      if (selectedImage) {
        mediaUrl = await uploadImage();
        if (!mediaUrl) {
          setLoading(false);
          return;
        }
      }

      const messageContent = input.trim() || '📷 Imagem';

      // Enviar mensagem via Edge Function (bypass RLS)
      const { error } = await supabase.functions.invoke('chatbot-customer-message', {
        body: {
          chatbotId,
          conversationId,
          content: messageContent,
          senderName: customer?.name || 'Você',
          mediaUrl,
          mediaType: mediaUrl ? 'image' : null,
        }
      });

      if (error) throw error;

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
          
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
            >
              <ImagePlus className="w-4 h-4" />
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
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Digite sua mensagem..."
              disabled={loading || uploadingImage}
              className="flex-1"
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={loading || uploadingImage || (!input.trim() && !selectedImage)}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
