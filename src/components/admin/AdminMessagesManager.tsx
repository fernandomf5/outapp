import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "./RichTextEditor";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Edit, Trash2, Send, MessageSquare } from "lucide-react";

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
  const [displayCount, setDisplayCount] = useState(5);

  useEffect(() => {
    fetchMessages();

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
      <Card className="border-primary/20 shadow-glow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Mensagens Enviadas ({messages.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p>Nenhuma mensagem enviada ainda</p>
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
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
