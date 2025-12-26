import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { Users, Circle, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface OnlineUser {
  user_id: string;
  email: string;
  full_name: string;
  online_at: string;
}

export const OnlineUsersPanel = () => {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const channel = supabase.channel('online-users');

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users: OnlineUser[] = [];
        
        Object.values(state).forEach((presences: any) => {
          presences.forEach((presence: OnlineUser) => {
            if (presence.user_id) {
              users.push(presence);
            }
          });
        });

        // Remove duplicates by user_id
        const uniqueUsers = users.reduce((acc: OnlineUser[], current) => {
          const exists = acc.find(u => u.user_id === current.user_id);
          if (!exists) {
            acc.push(current);
          }
          return acc;
        }, []);

        setOnlineUsers(uniqueUsers);
        setIsLoading(false);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        setOnlineUsers(prev => {
          const newUsers = [...prev];
          newPresences.forEach((presence: any) => {
            if (presence.user_id && !newUsers.find(u => u.user_id === presence.user_id)) {
              newUsers.push(presence as OnlineUser);
            }
          });
          return newUsers;
        });
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        setOnlineUsers(prev => 
          prev.filter(user => 
            !leftPresences.find((p: any) => p.user_id === user.user_id)
          )
        );
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const formatOnlineTime = (isoString: string) => {
    try {
      return format(new Date(isoString), "HH:mm", { locale: ptBR });
    } catch {
      return "--:--";
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="w-5 h-5 text-primary" />
            Usuários Online
          </CardTitle>
          <Badge variant="secondary" className="bg-green-500/20 text-green-500 border-green-500/30">
            <Circle className="w-2 h-2 fill-current mr-1" />
            {onlineUsers.length} online
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : onlineUsers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-20" />
            <p>Nenhum usuário online no momento</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {onlineUsers.map((user) => (
                <div
                  key={user.user_id}
                  className="flex items-center justify-between p-3 rounded-lg bg-card border border-border hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {user.full_name?.charAt(0)?.toUpperCase() || "U"}
                        </span>
                      </div>
                      <Circle className="w-3 h-3 fill-green-500 text-green-500 absolute -bottom-0.5 -right-0.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {user.full_name || "Usuário"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {formatOnlineTime(user.online_at)}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
