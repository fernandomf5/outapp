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

interface Conversation {
  id: string;
  status: string;
  created_at: string;
  last_message_at: string;
  ai_enabled?: boolean;
  agent_customers: {
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
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Carregar nome salvo do localStorage
  useEffect(() => {
    const savedName = localStorage.getItem(`agent_sender_name_${agentId}`);
    if (savedName) setSenderName(savedName);
  }, [agentId]);

  useEffect(() => {
    loadConversations();
    setupRealtimeSubscription();
  }, [agentId]);

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

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  const loadConversations = async () => {
    const { data, error } = await supabase
      .from('agent_conversations')
      .select(`
        *,
        agent_customers (
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
    const { data } = await supabase
      .from('agent_notifications')
      .select('id')
      .eq('agent_id', agentId)
      .eq('is_read', false);
    
    setUnreadCount(data?.length || 0);
  };

  const loadMessages = async (conversationId: string) => {
    const { data } = await supabase
      .from('agent_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    setMessages(data || []);
  };

  const setupRealtimeSubscription = () => {
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
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_messages',
        },
        (payload) => {
          if (selectedConversation && payload.new.conversation_id === selectedConversation.id) {
            // Recarregar todas as mensagens para garantir que aparecem em tempo real
            loadMessages(selectedConversation.id);
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

      // Verificar se AI está habilitada
      const needsDisableAI = selectedConversation.ai_enabled;

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

      // Inserir mensagem do atendente humano
      const { error: msgError } = await supabase
        .from('agent_messages')
        .insert({
          conversation_id: selectedConversation.id,
          role: 'agent',
          content: newMessage || (mediaType === 'image' ? '📷 Imagem' : '📄 Documento'),
          sender_name: senderName,
          media_url: mediaUrl,
          media_type: mediaType,
        });

      if (msgError) throw msgError;

      // Desabilitar IA automaticamente quando humano responde (apenas se ainda estiver habilitada)
      if (needsDisableAI) {
        const { error: convError } = await supabase
          .from('agent_conversations')
          .update({ ai_enabled: false })
          .eq('id', selectedConversation.id);

        if (convError) throw convError;

        // Inserir mensagem de sistema informando "atendente humano" apenas 1 vez
        await supabase
          .from('agent_messages')
          .insert({
            conversation_id: selectedConversation.id,
            role: 'agent',
            content: '👤 Atendente humano assumiu a conversa',
            sender_name: 'Sistema',
          });

        setSelectedConversation({ ...selectedConversation, ai_enabled: false });
      }

      setNewMessage("");
      setSelectedImage(null);
      setSelectedDocument(null);
      setImagePreview(null);
      toast({
        title: "Mensagem enviada",
        description: needsDisableAI ? "Você assumiu o atendimento desta conversa. A IA foi desabilitada." : "Mensagem enviada com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao enviar mensagem",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleToggleAI = async () => {
    if (!selectedConversation) return;

    try {
      const newAiEnabled = !selectedConversation.ai_enabled;
      
      const { error } = await supabase
        .from('agent_conversations')
        .update({ ai_enabled: newAiEnabled })
        .eq('id', selectedConversation.id);

      if (error) throw error;

      // Inserir mensagem de sistema
      await supabase
        .from('agent_messages')
        .insert({
          conversation_id: selectedConversation.id,
          role: 'agent',
          content: newAiEnabled 
            ? '🤖 IA reativada. Respostas automáticas foram habilitadas novamente.' 
            : '👤 IA desativada. Apenas atendimento humano.',
          sender_name: 'Sistema',
        });

      setSelectedConversation({ ...selectedConversation, ai_enabled: newAiEnabled });
      loadConversations();
      
      toast({
        title: newAiEnabled ? "IA reativada" : "IA desativada",
        description: newAiEnabled 
          ? "O agente IA voltará a responder automaticamente." 
          : "Apenas você poderá responder nesta conversa.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
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
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold">Conversas</h3>
          <div className="flex items-center gap-2">
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
                    // Marcar notificações relacionadas como lidas
                    await supabase
                      .from('agent_notifications')
                      .update({ is_read: true })
                      .eq('agent_id', agentId)
                      .eq('is_read', false);
                    loadUnreadCount();
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <div>
                          <div className="font-medium text-sm">{conv.agent_customers.name}</div>
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
                  <div>
                    <CardTitle className="text-lg">{selectedConversation.agent_customers.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{selectedConversation.agent_customers.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={selectedConversation.ai_enabled ? "destructive" : "default"}
                      size="sm"
                      onClick={handleToggleAI}
                    >
                      {selectedConversation.ai_enabled ? "🤖 Desativar IA" : "🤖 Ativar IA"}
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

              <ScrollArea className="flex-1 p-4">
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
                    onChange={(e) => setSenderName(e.target.value)}
                    className="w-[200px]"
                  />
                </div>
                
                <div className="flex gap-2">
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
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingMedia || !!selectedDocument}
                  >
                    <ImagePlus className="w-5 h-5" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => docInputRef.current?.click()}
                    disabled={uploadingMedia || !!selectedImage}
                  >
                    <FileText className="w-5 h-5" />
                  </Button>

                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Digite sua mensagem..."
                    className="flex-1"
                    disabled={uploadingMedia}
                  />
                  <Button 
                    onClick={handleSendMessage} 
                    disabled={uploadingMedia || (!newMessage.trim() && !selectedImage && !selectedDocument)}
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
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