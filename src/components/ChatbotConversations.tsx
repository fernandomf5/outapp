import { useEffect, useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { MessageSquare, Search, Send, User, Clock, X, Trash2, CheckCircle2, XCircle, ImagePlus, Smile } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

interface Conversation {
  id: string;
  chatbot_id: string;
  session_id: string;
  visitor_name: string | null;
  visitor_email: string | null;
  visitor_phone: string | null;
  status: string;
  started_at: string;
  last_message_at: string;
  chatbot?: {
    name: string;
  };
}

interface Message {
  id: string;
  conversation_id: string;
  role: string;
  content: string;
  media_url: string | null;
  media_type: string | null;
  created_at: string;
}

export const ChatbotConversations = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  const [selectedConversations, setSelectedConversations] = useState<string[]>([]);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [isVisitorTyping, setIsVisitorTyping] = useState(false);
  const [isVisitorOnline, setIsVisitorOnline] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Carregar conversas
  useEffect(() => {
    if (!user) return;

    const fetchConversations = async () => {
      const { data: chatbots } = await supabase
        .from('chatbots')
        .select('id')
        .eq('user_id', user.id);

      if (!chatbots || chatbots.length === 0) return;

      const chatbotIds = chatbots.map(c => c.id);

      const { data, error } = await supabase
        .from('chatbot_conversations')
        .select(`
          *,
          chatbots(name)
        `)
        .in('chatbot_id', chatbotIds)
        .order('last_message_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar conversas:', error);
        return;
      }

      setConversations(data || []);
    };

    fetchConversations();

    // Realtime subscription
    const channel = supabase
      .channel('chatbot-conversations')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chatbot_conversations'
      }, () => {
        fetchConversations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Auto-scroll quando mensagens mudam
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Carregar mensagens da conversa selecionada
  useEffect(() => {
    if (!selectedConversation) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('chatbot_messages')
        .select('*')
        .eq('conversation_id', selectedConversation.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Erro ao carregar mensagens:', error);
        return;
      }

      setMessages(data || []);
    };

    fetchMessages();

    // Realtime subscription para mensagens - recarrega TODAS as mensagens quando houver INSERT
    const messagesChannel = supabase
      .channel(`messages-${selectedConversation.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chatbot_messages',
        filter: `conversation_id=eq.${selectedConversation.id}`
      }, () => {
        console.log('📨 Nova mensagem recebida - recarregando...');
        fetchMessages();
      })
      .subscribe();

    // Canal para receber status de typing
    const typingChannel = supabase
      .channel(`typing-${selectedConversation.id}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        console.log('⌨️ Status de typing recebido:', payload);
        if (payload.payload.conversationId === selectedConversation.id) {
          setIsVisitorTyping(payload.payload.isTyping);
        }
      })
      .subscribe();

    // Canal de presença para detectar se o visitante está online
    const presenceChannel = supabase
      .channel(`presence-${selectedConversation.id}`)
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const presenceKeys = Object.keys(state);
        const isOnline = presenceKeys.some(key => 
          state[key].some((presence: any) => presence.user === 'visitor')
        );
        setIsVisitorOnline(isOnline);
        console.log('👥 Visitante online:', isOnline);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('👋 Visitante entrou:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('👋 Visitante saiu:', key, leftPresences);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(typingChannel);
      supabase.removeChannel(presenceChannel);
      setIsVisitorTyping(false);
      setIsVisitorOnline(false);
    };
  }, [selectedConversation]);

  const handleAdminTyping = (value: string) => {
    setNewMessage(value);
    
    if (!selectedConversation) return;
    
    // Enviar status de "digitando" para o cliente
    const channel = supabase.channel(`admin-typing-${selectedConversation.id}`);
    channel.send({
      type: 'broadcast',
      event: 'admin-typing',
      payload: { isTyping: value.length > 0, conversationId: selectedConversation.id }
    });

    // Limpar timeout anterior
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Enviar "parou de digitar" após 2 segundos
    typingTimeoutRef.current = setTimeout(() => {
      channel.send({
        type: 'broadcast',
        event: 'admin-typing',
        payload: { isTyping: false, conversationId: selectedConversation.id }
      });
    }, 2000);
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
    if ((!newMessage.trim() && !selectedImage) || !selectedConversation || isLoading) return;

    setIsLoading(true);
    try {
      let mediaUrl = null;
      if (selectedImage) {
        mediaUrl = await uploadImage();
        if (!mediaUrl) {
          setIsLoading(false);
          return;
        }
      }

      const messageContent = newMessage.trim() || '📷 Imagem';

      const { error } = await supabase
        .from('chatbot_messages')
        .insert({
          conversation_id: selectedConversation.id,
          role: 'admin',
          content: messageContent,
          sender_name: 'Atendente',
          media_url: mediaUrl,
          media_type: mediaUrl ? 'image' : null,
        });

      if (error) throw error;

      setNewMessage("");
      setSelectedImage(null);
      setImagePreview(null);
      
      // Foco de volta no input após enviar
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      
      toast({
        title: "Mensagem enviada! ✅",
        description: "Sua mensagem foi enviada com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao enviar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onEmojiSelect = (emoji: any) => {
    setNewMessage(prev => prev + emoji.native);
    setShowEmojiPicker(false);
  };

  const handleChangeStatus = async (conversationId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('chatbot_conversations')
        .update({ status: newStatus })
        .eq('id', conversationId);

      if (error) throw error;

      toast({
        title: "Status atualizado! ✅",
        description: `Status alterado para: ${newStatus === 'active' ? 'Ativo' : 'Encerrado'}`,
      });

      // Atualizar a conversa selecionada se for a mesma
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation({ ...selectedConversation, status: newStatus });
      }
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteConversation = async () => {
    if (!conversationToDelete) return;

    try {
      // Primeiro deletar mensagens
      await supabase
        .from('chatbot_messages')
        .delete()
        .eq('conversation_id', conversationToDelete);

      // Depois deletar conversa
      const { error } = await supabase
        .from('chatbot_conversations')
        .delete()
        .eq('id', conversationToDelete);

      if (error) throw error;

      toast({
        title: "Conversa excluída! ✅",
        description: "A conversa foi removida com sucesso.",
      });

      // Se era a conversa selecionada, limpar seleção
      if (selectedConversation?.id === conversationToDelete) {
        setSelectedConversation(null);
        setMessages([]);
      }

      setShowDeleteDialog(false);
      setConversationToDelete(null);
    } catch (error: any) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedConversations.length === 0) return;

    try {
      // Deletar mensagens de todas as conversas selecionadas
      await supabase
        .from('chatbot_messages')
        .delete()
        .in('conversation_id', selectedConversations);

      // Deletar conversas
      const { error } = await supabase
        .from('chatbot_conversations')
        .delete()
        .in('id', selectedConversations);

      if (error) throw error;

      toast({
        title: "Conversas excluídas! ✅",
        description: `${selectedConversations.length} conversa(s) removida(s) com sucesso.`,
      });

      // Se a conversa selecionada estava entre as excluídas, limpar
      if (selectedConversation && selectedConversations.includes(selectedConversation.id)) {
        setSelectedConversation(null);
        setMessages([]);
      }

      setSelectedConversations([]);
      setShowBulkDeleteDialog(false);
    } catch (error: any) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleSelectConversation = (conversationId: string) => {
    setSelectedConversations(prev =>
      prev.includes(conversationId)
        ? prev.filter(id => id !== conversationId)
        : [...prev, conversationId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedConversations.length === filteredConversations.length) {
      setSelectedConversations([]);
    } else {
      setSelectedConversations(filteredConversations.map(c => c.id));
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const searchLower = searchTerm.toLowerCase();
    return (
      conv.visitor_name?.toLowerCase().includes(searchLower) ||
      conv.visitor_email?.toLowerCase().includes(searchLower) ||
      conv.visitor_phone?.includes(searchTerm) ||
      conv.chatbot?.name?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-primary/10 p-3 rounded-xl">
          <MessageSquare className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Conversas de Clientes</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie todas as conversas dos seus chatbots
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de conversas */}
        <div className="lg:col-span-1 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar conversas..."
              className="pl-10"
            />
          </div>

          {filteredConversations.length > 0 && (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedConversations.length === filteredConversations.length}
                  onCheckedChange={toggleSelectAll}
                />
                <span className="text-sm text-muted-foreground">
                  {selectedConversations.length > 0 
                    ? `${selectedConversations.length} selecionada(s)` 
                    : 'Selecionar todas'}
                </span>
              </div>
              {selectedConversations.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowBulkDeleteDialog(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir selecionadas
                </Button>
              )}
            </div>
          )}

          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-2">
              {filteredConversations.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">
                    {searchTerm ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}
                  </p>
                </div>
              ) : (
                filteredConversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`p-4 rounded-lg border transition-all hover:shadow-md ${
                      selectedConversation?.id === conv.id
                        ? 'bg-primary/10 border-primary'
                        : 'bg-card border-border hover:bg-accent'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedConversations.includes(conv.id)}
                        onCheckedChange={() => toggleSelectConversation(conv.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1"
                      />
                      <div 
                        className="flex-1"
                        onClick={() => setSelectedConversation(conv)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="bg-primary/20 p-2 rounded-full">
                              <User className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">
                         {conv.visitor_name || 'Visitante Anônimo'}
                               </p>
                               <div className="flex items-center gap-2">
                                 <p className="text-xs text-muted-foreground">
                                   {conv.chatbot?.name}
                                 </p>
                                 {selectedConversation?.id === conv.id && isVisitorOnline && (
                                   <Badge variant="default" className="text-[10px] px-1.5 py-0">
                                     Online
                                   </Badge>
                                 )}
                               </div>
                            </div>
                          </div>
                          <Badge variant={conv.status === 'active' ? 'default' : 'secondary'}>
                            {conv.status === 'active' ? 'Ativo' : 'Encerrado'}
                          </Badge>
                        </div>
                        {conv.visitor_email && (
                          <p className="text-xs text-muted-foreground mb-1">
                            📧 {conv.visitor_email}
                          </p>
                        )}
                        {conv.visitor_phone && (
                          <p className="text-xs text-muted-foreground mb-1">
                            📱 {conv.visitor_phone}
                          </p>
                        )}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(conv.last_message_at), {
                            addSuffix: true,
                            locale: ptBR
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Chat */}
        <div className="lg:col-span-2">
          {selectedConversation ? (
            <div className="flex flex-col h-[680px] border rounded-lg bg-card">
              {/* Header do chat */}
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="bg-primary/20 p-2 rounded-full">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    {/* Indicador de status online/offline */}
                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card ${
                      isVisitorOnline ? 'bg-green-500' : 'bg-gray-400'
                    }`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">
                        {selectedConversation.visitor_name || 'Visitante Anônimo'}
                      </p>
                      <Badge variant={isVisitorOnline ? 'default' : 'secondary'} className="text-xs">
                        {isVisitorOnline ? 'Online' : 'Offline'}
                      </Badge>
                    </div>
                    {isVisitorTyping ? (
                      <p className="text-xs text-primary animate-pulse">
                        Digitando...
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        {selectedConversation.visitor_email || selectedConversation.visitor_phone || 'Sem contato'}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        Ações
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleChangeStatus(selectedConversation.id, 
                          selectedConversation.status === 'active' ? 'closed' : 'active'
                        )}
                      >
                        {selectedConversation.status === 'active' ? (
                          <>
                            <XCircle className="w-4 h-4 mr-2" />
                            Encerrar conversa
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Reabrir conversa
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => {
                          setConversationToDelete(selectedConversation.id);
                          setShowDeleteDialog(true);
                        }}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir conversa
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedConversation(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Mensagens */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === 'admin' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          msg.role === 'admin'
                            ? 'bg-primary text-primary-foreground'
                            : msg.role === 'bot'
                            ? 'bg-secondary/50'
                            : 'bg-muted'
                        }`}
                      >
                        {msg.role !== 'admin' && msg.role !== 'user' && (
                          <p className="text-xs text-muted-foreground mb-1">🤖 Bot</p>
                        )}
                        {msg.role === 'user' && (
                          <p className="text-xs text-muted-foreground mb-1">👤 Cliente</p>
                        )}
                        
                        {/* Renderizar mídia (com detecção por tipo ou extensão) */}
                        {msg.media_url && (msg.media_type?.toLowerCase().startsWith('image') || /\.(png|jpe?g|webp|gif)$/i.test(msg.media_url)) && (
                          <div className="mb-2">
                            <img 
                              src={msg.media_url}
                              alt="Imagem enviada pelo cliente"
                              className="rounded-lg max-w-full max-h-80 w-auto cursor-pointer hover:opacity-90 transition-opacity border border-border object-contain"
                              loading="lazy"
                              onClick={() => window.open(msg.media_url!, '_blank')}
                            />
                          </div>
                        )}

                        {msg.media_url && (msg.media_type?.toLowerCase().startsWith('video') || /\.(mp4|webm|ogg)$/i.test(msg.media_url)) && (
                          <div className="mb-2">
                            <video controls className="rounded-lg max-w-full max-h-80">
                              <source src={msg.media_url} />
                              Seu navegador não suporta vídeos.
                            </video>
                          </div>
                        )}

                        {msg.media_url && (msg.media_type?.toLowerCase().startsWith('audio') || /\.(mp3|wav|ogg|m4a)$/i.test(msg.media_url)) && (
                          <div className="mb-2">
                            <audio controls className="w-full">
                              <source src={msg.media_url} />
                              Seu navegador não suporta áudio.
                            </audio>
                          </div>
                        )}
                        
                        {msg.media_url && (
                          <a
                            href={msg.media_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs underline mt-1 inline-block"
                          >
                            Abrir arquivo
                          </a>
                        )}
                        
                        {/* Conteúdo da mensagem */}
                        {msg.content && msg.content !== '📷 Imagem' && (
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        )}
                        
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(msg.created_at).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                  {isVisitorTyping && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-lg p-3 flex items-center gap-1">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input de mensagem */}
              <div className="p-4 border-t">
                <div className="max-w-full">
                  {imagePreview && (
                    <div className="mb-2 relative inline-block">
                      <img src={imagePreview} alt="Preview" className="h-20 rounded-lg border border-border" />
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

                  <div className="flex gap-2 items-center">
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
                      title="Enviar imagem"
                    >
                      <ImagePlus className="w-4 h-4" />
                    </Button>

                    <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="icon" title="Inserir emoji">
                          <Smile className="w-4 h-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0 border-0" align="start">
                        <Picker data={data} onEmojiSelect={onEmojiSelect} theme="light" locale="pt" />
                      </PopoverContent>
                    </Popover>

                    <Input
                      ref={inputRef}
                      value={newMessage}
                      onChange={(e) => handleAdminTyping(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Digite sua mensagem..."
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={isLoading || (!newMessage.trim() && !selectedImage)}
                      className="bg-primary"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[680px] border rounded-lg bg-card">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-semibold mb-2">Selecione uma conversa</p>
                <p className="text-muted-foreground">
                  Escolha uma conversa para visualizar o histórico e responder
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conversa?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Todas as mensagens desta conversa serão
              permanentemente excluídas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConversation}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de confirmação de exclusão em massa */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {selectedConversations.length} conversa(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Todas as mensagens das conversas selecionadas serão
              permanentemente excluídas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir Todas
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
