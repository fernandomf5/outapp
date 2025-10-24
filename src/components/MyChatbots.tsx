import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, Pencil, Trash2, Copy, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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

export const MyChatbots = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [chatbots, setChatbots] = useState<any[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChatbots();

    // Subscrever mudanças em tempo real
    const subscription = supabase
      .channel('my_chatbots_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'chatbots',
        filter: `user_id=eq.${user?.id}`
      }, () => {
        fetchChatbots();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const fetchChatbots = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('chatbots')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setChatbots(data);
    }
    setLoading(false);
  };

  const handleEdit = (botId: string) => {
    navigate(`/bot-builder?id=${botId}`);
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    const { error } = await supabase
      .from('chatbots')
      .delete()
      .eq('id', deletingId);

    if (error) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setChatbots(chatbots.filter(bot => bot.id !== deletingId));
      toast({
        title: "Chatbot excluído",
        description: "O chatbot foi removido com sucesso.",
      });
    }
    setDeletingId(null);
  };

  const handleCopyLink = (botId: string) => {
    const link = `${window.location.origin}/chat/${botId}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copiado! 🔗",
      description: "O link do chatbot foi copiado para a área de transferência.",
    });
  };

  const handleOpenChat = (botId: string) => {
    window.open(`/chat/${botId}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (chatbots.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Bot className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-xl font-semibold mb-2">Nenhum chatbot criado ainda</h3>
        <p className="text-muted-foreground mb-6">
          Crie seu primeiro chatbot para começar a interagir com seus clientes
        </p>
        <Button onClick={() => navigate("/bot-builder")} className="mx-auto">
          <Bot className="w-4 h-4 mr-2" />
          Criar Chatbot
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Meus Chatbots</h2>
        <Button onClick={() => navigate("/bot-builder")}>
          <Bot className="w-4 h-4 mr-2" />
          Novo Chatbot
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {chatbots.map((bot) => (
          <Card key={bot.id} className="p-6 hover:shadow-lg transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-primary/10 p-3 rounded-xl">
                <Bot className="w-6 h-6 text-primary" />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(bot.id)}
                  title="Editar"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeletingId(bot.id)}
                  title="Excluir"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <h3 className="text-lg font-semibold mb-2">{bot.name}</h3>
            {bot.description && (
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {bot.description}
              </p>
            )}

            <div className="flex items-center justify-between text-sm mb-4">
              <span className={`px-2 py-1 rounded-full ${bot.is_active ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                {bot.is_active ? 'Ativo' : 'Inativo'}
              </span>
              <span className="text-muted-foreground">
                {new Date(bot.created_at).toLocaleDateString('pt-BR')}
              </span>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => handleCopyLink(bot.id)}
              >
                <Copy className="w-3 h-3 mr-2" />
                Copiar Link
              </Button>
              <Button
                variant="default"
                size="sm"
                className="flex-1"
                onClick={() => handleOpenChat(bot.id)}
              >
                <ExternalLink className="w-3 h-3 mr-2" />
                Abrir Chat
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Chatbot</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este chatbot? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
