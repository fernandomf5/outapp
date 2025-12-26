import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "./RichTextEditor";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Edit, Trash2, Send, MessageSquare, Plus, Search, User, X } from "lucide-react";

interface AdminMessage {
  id: string;
  title: string;
  message: string;
  content_html: string | null;
  image_url: string | null;
  created_at: string;
  sent_to_all: boolean;
  user_id: string | null;
}

export const AdminMessagesManager = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMessage, setEditingMessage] = useState<AdminMessage | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isNewMessageDialogOpen, setIsNewMessageDialogOpen] = useState(false);
  const [displayCount, setDisplayCount] = useState(5);
  const [totalUsers, setTotalUsers] = useState(0);
  
  // New message state
  const [newMessage, setNewMessage] = useState({
    title: "",
    message: "",
    imageUrl: "",
    sendToAll: true,
    selectedUserId: "",
  });
  const [userSearch, setUserSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  useEffect(() => {
    fetchMessages();
    fetchTotalUsers();

    // Real-time subscription
    const channel = supabase
      .channel('admin_messages_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'admin_messages'
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('admin_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setMessages(data);
    }
    setLoading(false);
  };

  const fetchTotalUsers = async () => {
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    setTotalUsers(count || 0);
  };

  const handleUserSearch = async (searchTerm: string) => {
    setUserSearch(searchTerm);
    
    if (searchTerm.length < 2) {
      setSearchResults([]);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, email, full_name')
      .or(`email.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`)
      .limit(10);

    if (!error && data) {
      setSearchResults(data);
    }
  };

  const handleSendNewMessage = async () => {
    if (!newMessage.title || !newMessage.message) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o título e a mensagem.",
        variant: "destructive",
      });
      return;
    }

    if (!newMessage.sendToAll && !newMessage.selectedUserId) {
      toast({
        title: "Selecione um usuário",
        description: "Escolha um usuário para enviar a mensagem.",
        variant: "destructive",
      });
      return;
    }

    // Criar HTML a partir da mensagem com quebras de linha e links
    const contentHtml = newMessage.message
      .split('\n')
      .map(line => {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return `<p>${line.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>')}</p>`;
      })
      .join('');

    const { error } = await supabase
      .from('admin_messages')
      .insert({
        title: newMessage.title,
        message: newMessage.message,
        content_html: `<div>${contentHtml}</div>`,
        image_url: newMessage.imageUrl || null,
        sent_to_all: newMessage.sendToAll,
        user_id: newMessage.sendToAll ? null : newMessage.selectedUserId,
        is_read: false
      });

    if (error) {
      toast({
        title: "Erro ao enviar mensagem",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    const description = newMessage.sendToAll 
      ? `Broadcast enviado para ${totalUsers} usuários.`
      : "Mensagem enviada para o usuário selecionado.";

    toast({
      title: "Mensagem enviada! 📨",
      description,
    });
    
    setNewMessage({ 
      title: "", 
      message: "", 
      imageUrl: "", 
      sendToAll: true, 
      selectedUserId: "" 
    });
    setUserSearch("");
    setSearchResults([]);
    setIsNewMessageDialogOpen(false);
    fetchMessages();
  };

  const handleDeleteMessage = async (messageId: string) => {
    const { error } = await supabase
      .from('admin_messages')
      .delete()
      .eq('id', messageId);

    if (error) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Mensagem excluída",
        description: "A mensagem foi removida com sucesso.",
      });
      setMessages(messages.filter(m => m.id !== messageId));
    }
  };

  const handleEditMessage = (message: AdminMessage) => {
    setEditingMessage({ ...message });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingMessage) return;

    const contentHtml = editingMessage.message
      .split('\n')
      .map(line => {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return line.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-primary underline">$1</a>');
      })
      .join('<br/>');

    const { error } = await supabase
      .from('admin_messages')
      .update({
        title: editingMessage.title,
        message: editingMessage.message,
        content_html: `<div>${contentHtml}</div>`,
        image_url: editingMessage.image_url,
      })
      .eq('id', editingMessage.id);

    if (error) {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Mensagem atualizada",
        description: "As alterações foram salvas com sucesso.",
      });
      setMessages(messages.map(m => m.id === editingMessage.id ? editingMessage : m));
      setIsEditDialogOpen(false);
      setEditingMessage(null);
    }
  };

  const handleResendMessage = async (message: AdminMessage) => {
    const contentHtml = message.message
      .split('\n')
      .map(line => {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return line.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-primary underline">$1</a>');
      })
      .join('<br/>');

    const { error } = await supabase
      .from('admin_messages')
      .insert({
        title: `[Reenviado] ${message.title}`,
        message: message.message,
        content_html: `<div>${contentHtml}</div>`,
        image_url: message.image_url,
        sent_to_all: message.sent_to_all,
        user_id: message.user_id,
        is_read: false
      });

    if (error) {
      toast({
        title: "Erro ao reenviar",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Mensagem reenviada",
        description: "A mensagem foi enviada novamente aos destinatários.",
      });
      fetchMessages();
    }
  };

  const loadMore = () => {
    setDisplayCount(prev => prev + 5);
  };

  if (loading) {
    return <div className="p-8 text-center">Carregando mensagens...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Botão Nova Mensagem */}
      <Card className="border-primary/20 shadow-glow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Mensagens Enviadas ({messages.length})
            </CardTitle>
            <Button 
              onClick={() => setIsNewMessageDialogOpen(true)}
              className="gradient-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Mensagem
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p>Nenhuma mensagem enviada ainda</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setIsNewMessageDialogOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Enviar primeira mensagem
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.slice(0, displayCount).map((message) => (
                  <Card key={message.id} className="border-border/50">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg">{message.title}</h3>
                            <Badge variant={message.sent_to_all ? "default" : "secondary"}>
                              {message.sent_to_all ? "Broadcast" : "Individual"}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(message.created_at).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditMessage(message)}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleResendMessage(message)}
                          >
                            <Send className="w-4 h-4 mr-2" />
                            Reenviar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteMessage(message.id)}
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {message.image_url && (
                        <img 
                          src={message.image_url} 
                          alt="Imagem da mensagem" 
                          className="w-full max-h-64 object-cover rounded-lg mb-4"
                        />
                      )}

                      <p className="text-muted-foreground whitespace-pre-wrap">
                        {message.message}
                      </p>
                    </CardContent>
                  </Card>
                ))}
                
                {displayCount < messages.length && (
                  <Button 
                    onClick={loadMore} 
                    variant="outline" 
                    className="w-full"
                  >
                    Carregar mais mensagens ({messages.length - displayCount} restantes)
                  </Button>
                )}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* New Message Dialog */}
      <Dialog open={isNewMessageDialogOpen} onOpenChange={setIsNewMessageDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Enviar Nova Mensagem
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-3">
              <Label>Destinatário</Label>
              <RadioGroup 
                value={newMessage.sendToAll ? "all" : "specific"}
                onValueChange={(value) => {
                  setNewMessage({ 
                    ...newMessage, 
                    sendToAll: value === "all",
                    selectedUserId: value === "all" ? "" : newMessage.selectedUserId
                  });
                  if (value === "all") {
                    setUserSearch("");
                    setSearchResults([]);
                  }
                }}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="new-all" />
                  <Label htmlFor="new-all" className="font-normal">
                    Todos os usuários ({totalUsers})
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="specific" id="new-specific" />
                  <Label htmlFor="new-specific" className="font-normal">
                    Usuário específico
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {!newMessage.sendToAll && (
              <div className="space-y-2">
                <Label htmlFor="new-user-search">Buscar Usuário</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="new-user-search"
                    placeholder="Digite nome ou email..."
                    value={userSearch}
                    onChange={(e) => handleUserSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                {searchResults.length > 0 && (
                  <ScrollArea className="h-40 border rounded-md">
                    <div className="p-2 space-y-1">
                      {searchResults.map((user) => (
                        <button
                          key={user.user_id}
                          onClick={() => {
                            setNewMessage({ 
                              ...newMessage, 
                              selectedUserId: user.user_id 
                            });
                            setUserSearch(`${user.full_name} (${user.email})`);
                            setSearchResults([]);
                          }}
                          className="w-full text-left p-2 hover:bg-accent rounded-md transition-colors"
                        >
                          <p className="font-medium text-sm">{user.full_name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                )}

                {newMessage.selectedUserId && (
                  <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-md">
                    <User className="w-4 h-4 text-primary" />
                    <span className="text-sm flex-1">{userSearch}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setNewMessage({ 
                          ...newMessage, 
                          selectedUserId: "" 
                        });
                        setUserSearch("");
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}

            <div>
              <Label htmlFor="new-title">Título</Label>
              <Input
                id="new-title"
                value={newMessage.title}
                onChange={(e) => setNewMessage({ ...newMessage, title: e.target.value })}
                placeholder="Ex: Novidades na plataforma!"
              />
            </div>

            <div>
              <Label htmlFor="new-message">Mensagem</Label>
              <RichTextEditor
                value={newMessage.message}
                onChange={(value) => setNewMessage({ ...newMessage, message: value })}
              />
            </div>

            <div>
              <Label htmlFor="new-image">URL da Imagem (opcional)</Label>
              <Input
                id="new-image"
                type="url"
                value={newMessage.imageUrl}
                onChange={(e) => setNewMessage({ ...newMessage, imageUrl: e.target.value })}
                placeholder="https://exemplo.com/imagem.jpg"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Adicione uma imagem à sua mensagem
              </p>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button variant="outline" onClick={() => {
                setIsNewMessageDialogOpen(false);
                setUserSearch("");
                setSearchResults([]);
                setNewMessage({ 
                  title: "", 
                  message: "", 
                  imageUrl: "", 
                  sendToAll: true, 
                  selectedUserId: "" 
                });
              }}>
                Cancelar
              </Button>
              <Button onClick={handleSendNewMessage} className="gradient-primary">
                <Send className="w-4 h-4 mr-2" />
                {newMessage.sendToAll ? "Enviar para Todos" : "Enviar Mensagem"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Mensagem</DialogTitle>
          </DialogHeader>
          
          {editingMessage && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Título</Label>
                <Input
                  id="edit-title"
                  value={editingMessage.title}
                  onChange={(e) => setEditingMessage({ ...editingMessage, title: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="edit-message">Mensagem</Label>
                <RichTextEditor
                  value={editingMessage.message}
                  onChange={(value) => setEditingMessage({ ...editingMessage, message: value })}
                />
              </div>

              <div>
                <Label htmlFor="edit-image">URL da Imagem (opcional)</Label>
                <Input
                  id="edit-image"
                  value={editingMessage.image_url || ''}
                  onChange={(e) => setEditingMessage({ ...editingMessage, image_url: e.target.value })}
                  placeholder="https://exemplo.com/imagem.jpg"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveEdit}>
                  Salvar Alterações
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
