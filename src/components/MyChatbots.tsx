import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, Pencil, Trash2, Copy, ExternalLink, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
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

interface MyChatbotsProps {
  onManage?: (chatbot: { id: string; name: string }) => void;
}

export const MyChatbots = ({ onManage }: MyChatbotsProps = {}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [chatbots, setChatbots] = useState<any[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Record<string, number>>({});

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
      fetchNotifications(data.map(bot => bot.id));
    }
    setLoading(false);
  };

  const fetchNotifications = async (chatbotIds: string[]) => {
    if (chatbotIds.length === 0) return;

    const { data: notificationsData } = await supabase
      .from('chatbot_notifications')
      .select('chatbot_id')
      .in('chatbot_id', chatbotIds)
      .eq('is_read', false);

    const notifCounts: Record<string, number> = {};
    chatbotIds.forEach(id => {
      notifCounts[id] = 0;
    });

    notificationsData?.forEach(item => {
      notifCounts[item.chatbot_id]++;
    });

    setNotifications(notifCounts);
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
        title: t('error'),
        description: error.message,
        variant: "destructive",
      });
    } else {
      setChatbots(chatbots.filter(bot => bot.id !== deletingId));
      toast({
        title: t('chatbot_deleted'),
        description: t('chatbot_deleted_desc'),
      });
    }
    setDeletingId(null);
  };

  const handleCopyLink = (botId: string) => {
    const link = `${window.location.origin}/chatbot-auth/${botId}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copiado! 🔗",
      description: "O link do chatbot foi copiado para a área de transferência.",
    });
  };

  const handleOpenChat = (botId: string) => {
    window.open(`/chatbot-auth/${botId}`, '_blank');
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
        <h3 className="text-xl font-semibold mb-2">Nenhum Chat Online</h3>
        <p className="text-muted-foreground mb-6">
          Crie seu primeiro chat online para começar a atender clientes em tempo real
        </p>
        <Button onClick={() => navigate("/bot-builder")} className="mx-auto">
          <Bot className="w-4 h-4 mr-2" />
          Criar Chat Online
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Meus Chats Online</h2>
        <Button onClick={() => navigate("/bot-builder")}>
          <Bot className="w-4 h-4 mr-2" />
          Novo Chat Online
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {chatbots.map((bot) => {
          const unreadCount = notifications[bot.id] || 0;
          
          return (
          <Card key={bot.id} className="p-6 hover:shadow-lg transition-all relative">
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-6 min-w-6 flex items-center justify-center rounded-full text-xs font-bold"
              >
                {unreadCount}
              </Badge>
            )}
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
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative"
                  onClick={() => onManage && onManage({ id: bot.id, name: bot.name })}
                  title="Notificações"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive rounded-full flex items-center justify-center text-[10px] text-white">
                      {unreadCount}
                    </span>
                  )}
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
                {bot.is_active ? t('chatbot_active') : t('chatbot_inactive')}
              </span>
              <span className="text-muted-foreground">
                {new Date(bot.created_at).toLocaleDateString('pt-BR')}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleCopyLink(bot.id)}
                >
                  <Copy className="w-3 h-3 mr-2" />
                  {t('copy_link')}
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleOpenChat(bot.id)}
                >
                  <ExternalLink className="w-3 h-3 mr-2" />
                  {t('open_chat')}
                </Button>
              </div>
              {onManage && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  onClick={() => onManage({ id: bot.id, name: bot.name })}
                >
                  Gerenciar
                </Button>
              )}
            </div>
          </Card>
        );
        })}
      </div>

      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('delete_chatbot')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('delete_chatbot_confirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
