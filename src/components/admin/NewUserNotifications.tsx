import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bell, UserPlus, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface NewUser {
  user_id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  is_read?: boolean;
}

export const NewUserNotifications = () => {
  const [newUsers, setNewUsers] = useState<NewUser[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [readUserIds, setReadUserIds] = useState<Set<string>>(new Set());

  // Load read state from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('admin_read_user_notifications');
    if (stored) {
      setReadUserIds(new Set(JSON.parse(stored)));
    }
  }, []);

  // Fetch recent users (last 7 days)
  const fetchRecentUsers = async () => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, email, full_name, created_at')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      const usersWithReadStatus = data.map(user => ({
        ...user,
        is_read: readUserIds.has(user.user_id)
      }));
      setNewUsers(usersWithReadStatus);
      setUnreadCount(usersWithReadStatus.filter(u => !u.is_read).length);
    }
  };

  useEffect(() => {
    fetchRecentUsers();

    // Subscribe to realtime changes for new user registrations
    const channel = supabase
      .channel('new-user-registrations')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          const newUser = payload.new as NewUser;
          setNewUsers(prev => [{
            ...newUser,
            is_read: false
          }, ...prev].slice(0, 50));
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [readUserIds]);

  const markAsRead = (userId: string) => {
    const newReadIds = new Set(readUserIds);
    newReadIds.add(userId);
    setReadUserIds(newReadIds);
    localStorage.setItem('admin_read_user_notifications', JSON.stringify([...newReadIds]));
    
    setNewUsers(prev => prev.map(user => 
      user.user_id === userId ? { ...user, is_read: true } : user
    ));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    const newReadIds = new Set(readUserIds);
    newUsers.forEach(user => newReadIds.add(user.user_id));
    setReadUserIds(newReadIds);
    localStorage.setItem('admin_read_user_notifications', JSON.stringify([...newReadIds]));
    
    setNewUsers(prev => prev.map(user => ({ ...user, is_read: true })));
    setUnreadCount(0);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <UserPlus className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <h4 className="font-semibold text-sm">Novos Cadastros</h4>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs h-7"
              onClick={markAllAsRead}
            >
              <Check className="h-3 w-3 mr-1" />
              Marcar todas como lidas
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-[300px]">
          {newUsers.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              Nenhum cadastro recente
            </div>
          ) : (
            <div className="divide-y">
              {newUsers.map((user) => (
                <div 
                  key={user.user_id} 
                  className={`p-3 flex items-start gap-3 hover:bg-muted/50 transition-colors ${
                    !user.is_read ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <UserPlus className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {user.full_name || 'Usuário sem nome'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(user.created_at), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  {!user.is_read && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 flex-shrink-0"
                      onClick={() => markAsRead(user.user_id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        <div className="p-2 border-t text-center">
          <p className="text-xs text-muted-foreground">
            Mostrando cadastros dos últimos 7 dias
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
};
