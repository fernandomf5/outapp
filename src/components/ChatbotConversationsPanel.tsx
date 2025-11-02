import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Search, Send, Trash2, ImagePlus, Smile, CheckSquare, Square } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

export const ChatbotConversationsPanel = ({ chatbotId }: { chatbotId: string }) => {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [senderName, setSenderName] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedConversations, setSelectedConversations] = useState<Set<string>>(new Set());
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Carregar nome salvo do localStorage
  useEffect(() => {
    const savedName = localStorage.getItem(`chatbot_sender_name_${chatbotId}`);
    if (savedName) setSenderName(savedName);
  }, [chatbotId]);

  useEffect(() => {
    loadConversations();
    const channel = supabase
      .channel('chatbot-conversations-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chatbot_conversations', filter: `chatbot_id=eq.${chatbotId}` }, () => {
        loadConversations();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chatbot_messages' }, (payload) => {
        if (selectedConversation && payload.new.conversation_id === selectedConversation.id) {
          setMessages(prev => [...prev, payload.new]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatbotId, selectedConversation]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  const loadConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('chatbot_conversations')
        .select('*')
        .eq('chatbot_id', chatbotId)
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
      
      // Contar notificações não lidas
      await loadUnreadCount();
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading conversations:', error);
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    const { data } = await supabase
      .from('chatbot_notifications')
      .select('id')
      .eq('chatbot_id', chatbotId)
      .eq('is_read', false);
    
    setUnreadCount(data?.length || 0);
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('chatbot_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
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

  const onEmojiSelect = (emoji: any) => {
    setNewMessage(prev => prev + emoji.native);
    setShowEmojiPicker(false);
  };

const handleSendMessage = async () => {
    if ((!newMessage.trim() && !selectedImage) || !selectedConversation) return;
    if (!senderName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, digite seu nome antes de enviar.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Salvar nome no localStorage
      localStorage.setItem(`chatbot_sender_name_${chatbotId}`, senderName);

      // Upload da imagem se existir
      let mediaUrl: string | null = null;
      if (selectedImage) {
        mediaUrl = await uploadImage();
        if (!mediaUrl) return; // erro já tratado em uploadImage
      }

      const messageContent = newMessage.trim() || '📷 Imagem';

      // Verificar se AI está habilitada
      const needsDisableAI = selectedConversation.ai_enabled;

      // Inserir mensagem do atendente humano com role 'bot'
      const { error: msgError } = await supabase
        .from('chatbot_messages')
        .insert({
          conversation_id: selectedConversation.id,
          role: 'bot',
          content: messageContent,
          sender_name: senderName,
          media_url: mediaUrl,
          media_type: mediaUrl ? 'image' : null,
        });

      if (msgError) throw msgError;

      // Desabilitar IA automaticamente quando humano responde (apenas se ainda estiver habilitada)
      if (needsDisableAI) {
        const { error: convError } = await supabase
          .from('chatbot_conversations')
          .update({ ai_enabled: false })
          .eq('id', selectedConversation.id);

        if (convError) throw convError;

        // Inserir mensagem de sistema informando "atendente humano"
        await supabase
          .from('chatbot_messages')
          .insert({
            conversation_id: selectedConversation.id,
            role: 'assistant',
            content: '👤 Atendente humano entrou na conversa',
            sender_name: 'Sistema',
          });

        setSelectedConversation({ ...selectedConversation, ai_enabled: false });
      }

      setNewMessage("");
      setSelectedImage(null);
      setImagePreview(null);
      toast({
        title: "Mensagem enviada",
        description: needsDisableAI ? "Você assumiu o atendimento desta conversa." : "Mensagem enviada com sucesso.",
      });

      // Foco de volta no input após enviar
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Erro ao enviar mensagem",
        description: "Não foi possível enviar a mensagem.",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!selectedConversation) return;

    try {
      const { error } = await supabase
        .from('chatbot_conversations')
        .update({ status })
        .eq('id', selectedConversation.id);

      if (error) throw error;

      setSelectedConversation({ ...selectedConversation, status });
      loadConversations();
      toast({
        title: "Status atualizado",
        description: "O status da conversa foi atualizado com sucesso.",
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Erro ao atualizar status",
        description: "Não foi possível atualizar o status.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteConversation = async () => {
    if (!conversationToDelete) return;

    try {
      // Deletar mensagens primeiro
      await supabase
        .from('chatbot_messages')
        .delete()
        .eq('conversation_id', conversationToDelete);

      // Deletar conversa
      const { error } = await supabase
        .from('chatbot_conversations')
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

  const handleToggleConversation = (conversationId: string) => {
    setSelectedConversations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(conversationId)) {
        newSet.delete(conversationId);
      } else {
        newSet.add(conversationId);
      }
      return newSet;
    });
  };

  const handleToggleAll = () => {
    if (selectedConversations.size === conversations.length) {
      setSelectedConversations(new Set());
    } else {
      setSelectedConversations(new Set(conversations.map(c => c.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedConversations.size === 0) return;

    try {
      // Deletar mensagens de todas as conversas selecionadas
      for (const conversationId of selectedConversations) {
        await supabase
          .from('chatbot_messages')
          .delete()
          .eq('conversation_id', conversationId);
      }

      // Deletar conversas selecionadas
      const { error } = await supabase
        .from('chatbot_conversations')
        .delete()
        .in('id', Array.from(selectedConversations));

      if (error) throw error;

      // Se a conversa selecionada foi deletada, limpar seleção
      if (selectedConversation && selectedConversations.has(selectedConversation.id)) {
        setSelectedConversation(null);
      }

      setSelectedConversations(new Set());
      loadConversations();
      setBulkDeleteDialogOpen(false);
      
      toast({
        title: "Conversas excluídas",
        description: `${selectedConversations.size} conversa(s) excluída(s) com sucesso.`,
      });
    } catch (error) {
      console.error('Error deleting conversations:', error);
      toast({
        title: "Erro ao excluir conversas",
        description: "Não foi possível excluir as conversas.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>;
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Conversas
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="rounded-full">
                    {unreadCount}
                  </Badge>
                )}
              </div>
            </CardTitle>
            {conversations.length > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToggleAll}
                >
                  {selectedConversations.size === conversations.length ? (
                    <>
                      <CheckSquare className="h-4 w-4 mr-2" />
                      Desmarcar todas
                    </>
                  ) : (
                    <>
                      <Square className="h-4 w-4 mr-2" />
                      Selecionar todas
                    </>
                  )}
                </Button>
                {selectedConversations.size > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setBulkDeleteDialogOpen(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir ({selectedConversations.size})
                  </Button>
                )}
              </div>
            )}
          </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <div className="space-y-2">
              {conversations.map((conversation) => (
                <Card
                  key={conversation.id}
                  className={`p-3 cursor-pointer hover:bg-muted/50 ${
                    selectedConversation?.id === conversation.id ? 'bg-muted' : ''
                  }`}
                  onClick={async () => {
                    setSelectedConversation(conversation);
                    // Marcar notificações relacionadas como lidas
                    await supabase
                      .from('chatbot_notifications')
                      .update({ is_read: true })
                      .eq('chatbot_id', chatbotId)
                      .eq('is_read', false);
                    loadUnreadCount();
                  }}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-5 w-5 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleConversation(conversation.id);
                          }}
                        >
                          {selectedConversations.has(conversation.id) ? (
                            <CheckSquare className="h-4 w-4 text-primary" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </Button>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {conversation.visitor_name || conversation.visitor_email?.split('@')[0] || conversation.visitor_phone || 'Visitante Anônimo'}
                          </span>
                          <span className="text-xs text-muted-foreground">#{conversation.id.slice(0, 8)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(conversation.last_message_at), { 
                            addSuffix: true,
                            locale: ptBR 
                          })}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConversationToDelete(conversation.id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <Badge variant={conversation.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                      {conversation.status === 'active' ? 'Ativa' : conversation.status === 'closed' ? 'Fechada' : conversation.status}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Mensagens</CardTitle>
            {selectedConversation && (
              <Select value={selectedConversation.status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativa</SelectItem>
                  <SelectItem value="closed">Fechada</SelectItem>
                  <SelectItem value="resolved">Resolvida</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {selectedConversation ? (
            <div className="space-y-4">
              <ScrollArea className="h-[400px] border rounded-lg p-4">
                <div className="space-y-4">
{messages.map((message) => {
                    // Mensagens do sistema (notificações automáticas)
                    if (message.role === 'assistant' || message.sender_name === 'Sistema') {
                      return (
                        <div key={message.id} className="flex justify-center">
                          <div className="max-w-[85%] rounded-lg p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">Sistema</Badge>
                            </div>
                            <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                            <span className="text-xs opacity-70 mt-1 block">
                              {formatDistanceToNow(new Date(message.created_at), { 
                                addSuffix: true,
                                locale: ptBR 
                              })}
                            </span>
                          </div>
                        </div>
                      );
                    }
                    
                    // Mensagens normais (usuário ou chatbot)
                    return (
                      <div
                        key={message.id}
                        className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}
                      >
                        <span className="text-xs text-muted-foreground mb-1 px-1">
                          {message.role === 'user' ? (message.sender_name || selectedConversation.visitor_name || 'Cliente') : (message.sender_name || 'Bot')}
                        </span>
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          {/* Mídia - imagem */}
                          {message.media_url && (message.media_type?.toLowerCase()?.startsWith('image') || /(png|jpe?g|webp|gif)$/i.test(message.media_url)) && (
                            <div className="mb-2">
                              <img 
                                src={message.media_url}
                                alt="Imagem enviada"
                                className="rounded-lg max-w-full max-h-80 w-auto cursor-pointer hover:opacity-90 transition-opacity border border-border object-contain"
                                loading="lazy"
                                onClick={() => window.open(message.media_url!, '_blank')}
                              />
                            </div>
                          )}

                          {/* Mídia - vídeo */}
                          {message.media_url && (message.media_type?.toLowerCase()?.startsWith('video') || /(mp4|webm|ogg)$/i.test(message.media_url)) && (
                            <div className="mb-2">
                              <video controls className="rounded-lg max-w-full max-h-80">
                                <source src={message.media_url} />
                                Seu navegador não suporta vídeos.
                              </video>
                            </div>
                          )}

                          {/* Mídia - áudio */}
                          {message.media_url && (message.media_type?.toLowerCase()?.startsWith('audio') || /(mp3|wav|ogg|m4a)$/i.test(message.media_url)) && (
                            <div className="mb-2">
                              <audio controls className="w-full">
                                <source src={message.media_url} />
                                Seu navegador não suporta áudio.
                              </audio>
                            </div>
                          )}

                          {/* Link para abrir arquivo */}
                          {message.media_url && (
                            <a
                              href={message.media_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs underline mt-1 inline-block"
                            >
                              Abrir arquivo
                            </a>
                          )}

                          {/* Conteúdo textual - exibe sempre que houver texto real */}
                          {message.content && message.content.trim() !== '' && message.content.trim() !== '📷 Imagem' && (
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          )}
                          
                          <span className="text-xs opacity-70 mt-1 block">
                            {formatDistanceToNow(new Date(message.created_at), { 
                              addSuffix: true,
                              locale: ptBR 
                            })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

<div className="max-w-full w-full">
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
                      <Trash2 className="h-4 w-4" />
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
                    placeholder="Seu nome"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    className="w-[200px]"
                  />
                  <Input
                    ref={inputRef}
                    placeholder="Digite sua mensagem..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button onClick={handleSendMessage} disabled={uploadingImage || (!newMessage.trim() && !selectedImage)}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-12">
              Selecione uma conversa para visualizar as mensagens
            </p>
          )}
        </CardContent>
      </Card>
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

    <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir {selectedConversations.size} conversa(s)?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita. Todas as mensagens das conversas selecionadas serão excluídas permanentemente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Excluir Todas
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>
  );
};